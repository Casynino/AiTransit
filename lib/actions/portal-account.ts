"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { recordAudit } from "@/lib/audit";
import { normalisePhone } from "@/lib/format";
import { nextTicketNumber } from "@/lib/ids";
import { requireCustomer } from "@/lib/portal";
import { prisma } from "@/lib/prisma";
import { putImage } from "@/lib/storage";
import { TERMS_VERSION } from "@/lib/terms";
import { recordTermsAcceptance, ticked } from "@/lib/terms-accept";
import { fail, ok, toActionError, type ActionResult } from "@/lib/actions/types";

/**
 * The customer's own account: claims, conversations, settings.
 *
 * The four rules from portal-requests.ts hold here too. Two more matter
 * specifically to this file:
 *
 *   A CUSTOMER WRITES INTO A SHARED THREAD, NOT A PRIVATE ONE. Their replies go
 *   onto the same SupportTicket and the same ShipmentException the desk works,
 *   as visible entries beside the desk's own. That is why TicketNote.internal
 *   and ExceptionEvent.customerVisible exist — see their comments in
 *   schema.prisma. Everything written here is explicitly on the customer's side
 *   of that line, and nothing here can read across it.
 *
 *   VERIFIED FACTS ARE NOT SELF-SERVICE. A customer may correct how to reach
 *   them. They may not rename themselves, move their credit limit, or change
 *   the phone number their account is identified by without somebody looking —
 *   see updateProfile, which routes a phone change through the support desk
 *   rather than applying it.
 */

/* ------------------------------------------------------------------ claims */

const claimSchema = z.object({
  shipmentId: z.string().min(1, "Which cargo is this about?"),
  type: z.enum([
    "MISSING_SHIPMENT",
    "DAMAGED_CARGO",
    "WRONG_ITEM",
    "PACKAGE_COUNT_MISMATCH",
    "OTHER",
  ]),
  description: z
    .string()
    .trim()
    .min(15, "Please describe what happened — a sentence or two.")
    .max(4000),
});

/**
 * "Something is wrong with my cargo."
 *
 * Writes a ShipmentException in OPEN, into the investigation queue the Lusaka
 * warehouse and Customer Support already work. Deliberately NOT a support
 * ticket: a claim against cargo has an outcome a ticket does not — the box is
 * found, or compensation is agreed — and mixing the two means claims get closed
 * with "answered" when nobody has found anything.
 *
 * A photo is taken if offered and is worth asking for, because a damage claim
 * with no photograph is a claim that will be settled on somebody's memory.
 */
export async function raiseClaim(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const parsed = claimSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Please check the form.");
  }
  const input = parsed.data;

  try {
    const viewer = await requireCustomer();

    const cargo = await prisma.shipment.findFirst({
      where: { id: input.shipmentId, customerId: viewer.customerId, deletedAt: null },
      select: { id: true, trackingNumber: true, batchId: true },
    });
    if (!cargo) return fail("We cannot find that cargo on your account.");

    /* One open claim per consignment per kind. A customer who submits twice
       because the first page was slow should not create two investigations. */
    const dup = await prisma.shipmentException.findFirst({
      where: {
        shipmentId: cargo.id,
        type: input.type,
        status: { in: ["OPEN", "UNDER_INVESTIGATION", "WAITING_CUSTOMER"] },
      },
      select: { id: true },
    });
    if (dup) {
      return fail(
        `You already have an open claim of this kind for ${cargo.trackingNumber}.`
      );
    }

    const photo = formData.get("photo");
    const stored =
      photo instanceof File && photo.size > 0 ? await putImage(photo, "claims") : null;

    const claim = await prisma.$transaction(async (tx) => {
      const created = await tx.shipmentException.create({
        data: {
          shipmentId: cargo.id,
          batchId: cargo.batchId,
          type: input.type,
          status: "OPEN",
          description: input.description,
          /*
            raisedById stays null. The column is a User relation and the portal
            account IS a User, but every screen in the investigation queue reads
            it as "which member of staff raised this" and renders it beside a
            department. Writing a customer there would put a customer's name in
            a staff column. The audit entry below records who actually raised it.
          */
          raisedById: null,
        },
        select: { id: true },
      });

      await tx.exceptionEvent.create({
        data: {
          exceptionId: created.id,
          action: "opened",
          note: `Raised by the customer through the portal: ${input.description}`,
          customerVisible: true,
        },
      });

      if (stored) {
        await tx.shipmentPhoto.create({
          data: {
            shipmentId: cargo.id,
            exceptionId: created.id,
            url: stored.url,
            kind: "DAMAGE",
            caption: "Submitted by the customer",
          },
        });
      }

      return created;
    });

    await recordAudit({
      actor: null,
      action: "portal.claimRaised",
      entity: "ShipmentException",
      entityId: claim.id,
      summary: `${viewer.name} raised a ${input.type} claim on ${cargo.trackingNumber}`,
      metadata: { customerId: viewer.customerId },
    });

    revalidatePath("/portal/claims");
    revalidatePath("/app/exceptions");
    return ok();
  } catch (error) {
    return fail(toActionError(error));
  }
}

const claimReplySchema = z.object({
  claimId: z.string().min(1),
  body: z.string().trim().min(2, "Write your message.").max(4000),
});

/** The customer's reply on their own claim, visible to both sides. */
export async function replyToClaim(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const parsed = claimReplySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Please check the form.");
  }
  const input = parsed.data;

  try {
    const viewer = await requireCustomer();

    const claim = await prisma.shipmentException.findFirst({
      where: { id: input.claimId, shipment: { customerId: viewer.customerId } },
      select: { id: true, status: true },
    });
    if (!claim) return fail("We cannot find that claim on your account.");
    if (["CLOSED", "RESOLVED", "WRITTEN_OFF"].includes(claim.status)) {
      return fail("That claim is closed. Open a support message if you need more.");
    }

    await prisma.exceptionEvent.create({
      data: {
        exceptionId: claim.id,
        action: "customer.replied",
        note: input.body,
        customerVisible: true,
      },
    });

    /*
      WAITING_CUSTOMER means the ball was in their court. Their reply hands it
      back, so the claim returns to UNDER_INVESTIGATION and reappears in the
      queue. Without this a customer answers a question and their claim sits in
      a bucket nobody is looking at.
    */
    if (claim.status === "WAITING_CUSTOMER") {
      await prisma.shipmentException.update({
        where: { id: claim.id },
        data: { status: "UNDER_INVESTIGATION" },
      });
    }

    revalidatePath(`/portal/claims/${claim.id}`);
    revalidatePath("/app/exceptions");
    return ok();
  } catch (error) {
    return fail(toActionError(error));
  }
}

/* ----------------------------------------------------------------- support */

const ticketSchema = z.object({
  category: z.enum([
    "SHIPMENT_INQUIRY",
    "PRICE_INQUIRY",
    "SOURCING",
    "GENERAL",
    "COMPLAINT",
    "FEEDBACK",
  ]),
  subject: z.string().trim().min(4, "Give it a short subject.").max(200),
  body: z.string().trim().min(10, "Tell us what you need.").max(4000),
  shipmentId: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v?.length ? v : null)),
});

/** Start a conversation with the support desk. */
export async function openTicket(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const parsed = ticketSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Please check the form.");
  }
  const input = parsed.data;

  try {
    const viewer = await requireCustomer();

    let shipmentId: string | null = null;
    if (input.shipmentId) {
      const cargo = await prisma.shipment.findFirst({
        where: { id: input.shipmentId, customerId: viewer.customerId, deletedAt: null },
        select: { id: true },
      });
      if (!cargo) return fail("We cannot find that cargo on your account.");
      shipmentId = cargo.id;
    }

    const ticket = await prisma.$transaction(async (tx) =>
      tx.supportTicket.create({
        data: {
          ticketNumber: await nextTicketNumber(tx),
          customerId: viewer.customerId,
          contactName: viewer.name,
          contactPhone: viewer.phone,
          shipmentId,
          category: input.category,
          /*
            Priority is NORMAL and is not on the form. A customer choosing their
            own priority means every ticket is urgent, and the desk then has no
            way to see which one actually is. Support raises it when it should be.
          */
          priority: "NORMAL",
          status: "OPEN",
          /* Not WHATSAPP, which is the default and would be a lie in the log. */
          channel: "EMAIL",
          subject: input.subject,
          body: input.body,
        },
        select: { id: true, ticketNumber: true },
      })
    );

    await recordAudit({
      actor: null,
      action: "portal.ticketOpened",
      entity: "SupportTicket",
      entityId: ticket.id,
      summary: `${viewer.name} opened ${ticket.ticketNumber} — ${input.subject}`,
      metadata: { customerId: viewer.customerId },
    });

    revalidatePath("/portal/support");
    revalidatePath("/app/support/tickets");
    return ok();
  } catch (error) {
    return fail(toActionError(error));
  }
}

const replySchema = z.object({
  ticketId: z.string().min(1),
  body: z.string().trim().min(2, "Write your message.").max(4000),
});

/** A customer's reply on their own thread. */
export async function replyToTicket(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const parsed = replySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Please check the form.");
  }
  const input = parsed.data;

  try {
    const viewer = await requireCustomer();

    const ticket = await prisma.supportTicket.findFirst({
      where: { id: input.ticketId, customerId: viewer.customerId },
      select: { id: true, status: true },
    });
    if (!ticket) return fail("We cannot find that conversation on your account.");

    await prisma.ticketNote.create({
      data: {
        ticketId: ticket.id,
        body: input.body,
        /* The customer's own account authors it, so the thread shows who spoke. */
        authorId: viewer.userId,
        internal: false,
      },
    });

    /*
      A reply reopens a thread that had been answered. Somebody replying to
      "resolved" is telling us it was not, and leaving the status alone means
      that message is never read.
    */
    if (["RESOLVED", "CLOSED", "WAITING_CUSTOMER"].includes(ticket.status)) {
      await prisma.supportTicket.update({
        where: { id: ticket.id },
        data: { status: "OPEN", resolvedAt: null },
      });
    }

    revalidatePath(`/portal/support/${ticket.id}`);
    revalidatePath("/app/support/tickets");
    return ok();
  } catch (error) {
    return fail(toActionError(error));
  }
}

/* ----------------------------------------------------------- notifications */

/** Mark one notification read. Scoped to the signed-in user's own rows. */
export async function readNotification(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  try {
    const viewer = await requireCustomer();
    const id = String(formData.get("id") ?? "");
    if (!id) return fail("Nothing to mark.");

    /*
      updateMany, not update. `update` throws when the WHERE matches nothing,
      which for a compound where means the caller has to distinguish "already
      read" from "not yours" — and the safe answer to both is the same silence.
    */
    await prisma.notification.updateMany({
      where: { id, userId: viewer.userId, readAt: null },
      data: { readAt: new Date() },
    });

    revalidatePath("/portal/notifications");
    revalidatePath("/portal");
    return ok();
  } catch (error) {
    return fail(toActionError(error));
  }
}

export async function readAllNotifications(): Promise<ActionResult> {
  try {
    const viewer = await requireCustomer();
    await prisma.notification.updateMany({
      where: { userId: viewer.userId, readAt: null },
      data: { readAt: new Date() },
    });
    revalidatePath("/portal/notifications");
    revalidatePath("/portal");
    return ok();
  } catch (error) {
    return fail(toActionError(error));
  }
}

/* ---------------------------------------------------------------- profile */

const profileSchema = z.object({
  altPhone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .transform((v) => (v?.length ? v : null)),
  city: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => (v?.length ? v : null)),
  address: z
    .string()
    .trim()
    .max(400)
    .optional()
    .transform((v) => (v?.length ? v : null)),
  notifyWhatsapp: z.string().optional().transform((v) => v === "on"),
  notifyEmail: z.string().optional().transform((v) => v === "on"),
  notifySms: z.string().optional().transform((v) => v === "on"),
});

/**
 * What a customer may change about themselves without anybody looking.
 *
 * WHAT IS NOT HERE MATTERS MORE THAN WHAT IS. Name, primary phone, email, code
 * and every credit field are absent by design:
 *
 *   The NAME is on invoices already issued and on pickup notes the warehouse
 *   releases cargo against. Changing it silently would make a customer's own
 *   documents disagree with their account.
 *
 *   The PRIMARY PHONE is how the counter finds them and is unique across the
 *   database. It is also the identifier the Guangzhou desk matched them on. A
 *   customer with a new number raises a support thread and somebody moves it.
 *
 *   CREDIT is Finance's, and is the point of Finance having it.
 *
 * A second phone, a city and an address are corrections to how we reach them,
 * and getting those wrong costs a delivery rather than an identity.
 */
export async function updateProfile(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Please check the form.");
  }
  const input = parsed.data;

  try {
    const viewer = await requireCustomer();

    await prisma.customer.update({
      where: { id: viewer.customerId },
      data: {
        altPhone: input.altPhone ? normalisePhone(input.altPhone) : null,
        city: input.city,
        address: input.address,
        notifyWhatsapp: input.notifyWhatsapp,
        notifyEmail: input.notifyEmail,
        notifySms: input.notifySms,
      },
    });

    await recordAudit({
      actor: null,
      action: "portal.profileUpdated",
      entity: "Customer",
      entityId: viewer.customerId,
      summary: `${viewer.name} updated their contact details`,
      metadata: { customerId: viewer.customerId },
    });

    revalidatePath("/portal/profile");
    return ok();
  } catch (error) {
    return fail(toActionError(error));
  }
}

const passwordSchema = z
  .object({
    current: z.string().min(1, "Enter your current password."),
    next: z.string().min(8, "Use at least 8 characters.").max(200),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, {
    message: "The two new passwords do not match.",
    path: ["confirm"],
  });

/**
 * Change a password, having proved you know the old one.
 *
 * The current password is required even though the session already proves who
 * this is. A session is evidence that somebody signed in at some point; it is
 * not evidence that the person at the keyboard now is them, and an unattended
 * phone is the ordinary way an account is taken.
 */
export async function changePassword(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Please check the form.");
  }
  const input = parsed.data;

  try {
    const viewer = await requireCustomer();

    const user = await prisma.user.findUnique({
      where: { id: viewer.userId },
      select: { id: true, passwordHash: true },
    });
    if (!user?.passwordHash) return fail("This account has no password set.");

    const okay = await bcrypt.compare(input.current, user.passwordHash);
    if (!okay) return fail("That is not your current password.");

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(input.next, 10) },
    });

    await recordAudit({
      actor: null,
      action: "portal.passwordChanged",
      entity: "User",
      entityId: user.id,
      summary: `${viewer.name} changed their portal password`,
      metadata: { customerId: viewer.customerId },
    });

    return ok();
  } catch (error) {
    return fail(toActionError(error));
  }
}

/* ------------------------------------------------------------------- terms */

/**
 * "I agree."
 *
 * The only write in the portal that a customer can make before they have
 * accepted the terms — everything else is behind requireAcceptedTerms, and this
 * is what gets them through it.
 *
 * It uses requireCustomer rather than requireAcceptedTerms, deliberately: the
 * acceptance action cannot demand acceptance as a precondition of accepting.
 *
 * The tick is re-checked here even though the form marks it required. `required`
 * is a browser behaviour, and a browser is not a place to enforce anything.
 */
export async function acceptTerms(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  try {
    const viewer = await requireCustomer();

    if (!ticked(formData.get("acceptTerms"))) {
      return fail("Tick the box to agree to the terms before continuing.");
    }

    await recordTermsAcceptance("portal", {
      customerId: viewer.customerId,
      name: viewer.name,
      phone: viewer.phone,
      email: viewer.email,
    });

    await recordAudit({
      actor: null,
      action: "portal.termsAccepted",
      entity: "Customer",
      entityId: viewer.customerId,
      summary: `${viewer.name} accepted the terms of business (${TERMS_VERSION})`,
      metadata: { customerId: viewer.customerId, version: TERMS_VERSION },
    });

    /* Every portal page reads the gate, so every one of them is now stale. */
    revalidatePath("/portal", "layout");
    return ok();
  } catch (error) {
    return fail(toActionError(error));
  }
}
