/**
 * What each department's guide book says, in English and Chinese.
 *
 * SEPARATED FROM THE RENDERER on purpose. The layout is one problem and the
 * words are another, and the words are the half that gets corrected by people
 * who do the job — a supervisor who finds a step out of order should be able to
 * fix it here without meeting a single line of HTML.
 *
 * THE CHINESE IS NOT A GLOSS. Every screen name matches the app's own zh
 * dictionary in lib/i18n.ts, because a guide that invents its own translation
 * for a button teaches a word the staff will never see on screen.
 *
 * Each step is a THING TO DO, not a description of a screen. "Weigh the box
 * before you type" is a step; "the weight field accepts decimals" is a caption.
 */

export type Lang = "en" | "zh";

export type Step = {
  /** The instruction, in the imperative. */
  do: Record<Lang, string>;
  /** Why, when it is not obvious — omitted more often than not. */
  why?: Record<Lang, string>;
};

export type Section = {
  /** Screenshot id from docs/screens, without the .desktop/.phone suffix. */
  shot?: string;
  /** Show the phone photograph beside the desktop one. */
  phone?: boolean;
  title: Record<Lang, string>;
  lede: Record<Lang, string>;
  steps?: Step[];
  /** A box that stops somebody making an expensive mistake. */
  warn?: Record<Lang, string>;
  /** A box with something worth knowing. */
  note?: Record<Lang, string>;
};

export type Guide = {
  key: string;
  /** Which staff login this guide belongs to. */
  account: string;
  name: Record<Lang, string>;
  subtitle: Record<Lang, string>;
  /** Three or four things this desk is answerable for. */
  owns: Record<Lang, string>[];
  sections: Section[];
};

const t = (en: string, zh: string) => ({ en, zh });

/* ------------------------------------------------------------------ shared */

export const UI = {
  guideBook: t("Guide book", "操作手册"),
  department: t("Department", "部门"),
  yourLogin: t("Your login", "您的账号"),
  contents: t("Contents", "目录"),
  step: t("Step", "步骤"),
  onDesktop: t("On a computer", "电脑版"),
  onPhone: t("On a phone", "手机版"),
  careful: t("Be careful", "请注意"),
  goodToKnow: t("Good to know", "温馨提示"),
  youAreResponsibleFor: t("This desk is responsible for", "本岗位负责"),
  signIn: t("Signing in", "登录"),
  signInLede: t(
    "Everyone at AITRANSIT signs in at the same address with their own email and password. The system knows your department and opens your own screens — you never choose a role.",
    "AITRANSIT 全体员工使用同一网址、各自的邮箱和密码登录。系统会自动识别您所属的部门并打开对应的页面，无需选择角色。"
  ),
  langNote: t(
    "Every screen in this system is available in English and 中文. The switch is at the bottom of the sidebar, beside your name.",
    "本系统所有页面均支持英文和中文。切换按钮位于左侧栏底部、您的姓名旁边。"
  ),
  helpTitle: t("If something is wrong", "遇到问题时"),
  helpBody: t(
    "Do not work around it. A wrong record is harder to fix than a missing one — tell your supervisor, or raise it under Issues & Claims, and let the system record what happened.",
    "请不要自行绕过。错误的记录比缺失的记录更难修正——请告知主管，或在「问题与索赔」中提交，让系统完整记录事情经过。"
  ),
  beforeYouStart: t("Before you start", "开始之前"),
  onEveryScreen: t("On every screen", "每个页面都有"),
  onEveryScreenBody: t(
    "The sidebar on the left is your department's menu — it only ever shows what your desk is allowed to open. The search box at the top accepts a tracking number, a customer, a phone number or a QR scan. Your name is at the bottom of the sidebar, with the language switch and the light/dark switch beside it.",
    "左侧栏是您所属部门的菜单，只会显示本岗位有权限打开的功能。顶部搜索框可输入运单号、客户、电话号码，也可扫描二维码。您的姓名在左侧栏底部，旁边是语言切换和深色/浅色切换。"
  ),
  page: t("Page", "第"),
  of: t("of", "页，共"),
};

/* ------------------------------------------------------------------ guides */

export const GUIDES: Guide[] = [
  /* ============================================== CHINA WAREHOUSE ========= */
  {
    key: "china-warehouse",
    account: "china@aitransit.co.zm",
    name: t("China Warehouse", "中国仓库"),
    subtitle: t(
      "Guangzhou desk — receiving, labelling and loading",
      "广州操作台 —— 收货、贴标与装板"
    ),
    owns: [
      t("Every box that arrives at the Guangzhou counter is recorded the same day",
        "当天到达广州柜台的每一件货物都必须当天登记"),
      t("Every consignment is weighed, photographed and given a QR label",
        "每一票货物都要过磅、拍照并贴上二维码标签"),
      t("Cargo is placed on the correct loading table for its route",
        "货物按航线放置在正确的装板台上"),
    ],
    sections: [
      {
        shot: "cn-home",
        phone: true,
        title: t("Your home screen", "首页"),
        lede: t(
          "This is what is happening on the floor today. The two clocks are China and Zambia, so you always know what time it is at the other end before you telephone.",
          "这里显示今天现场的情况。两个时钟分别是中国和赞比亚时间，方便您在联系另一端之前先确认对方的时间。"
        ),
        steps: [
          { do: t("Read Needs your attention first. Anything listed there is already late or already wrong.",
                  "先看「需要处理」。列在那里的每一项，要么已经延误，要么已经出错。") },
          { do: t("Use the search box for a tracking number, a customer name, a phone number or a batch.",
                  "在搜索框中可查询运单号、客户名称、电话号码或批次。") },
          {
            do: t("The two loading tables are below — Guangzhou and Hong Kong. They tell you what is waiting to fly.",
                  "下方是两张装货台账——广州和香港。它们显示当前有哪些货物等待发运。"),
            why: t("A table showing Empty means the last flight has gone and nothing has been placed on it since.",
                   "台账显示“空”，表示上一班航班已发出，之后还没有新货物放上去。"),
          },
          {
            do: t("Receive cargo is the button you will use most. Everything else on this screen is here so you know what to do between boxes.",
                  "“收货”是您使用最频繁的按钮。此页面上的其他内容，是为了让您在两票货之间知道该做什么。"),
          },
        ],
        note: t(
          "Cargo today counts what you have registered since midnight China time, not since midnight in Lusaka.",
          "「今日货量」统计的是中国时间零点之后登记的货物，而不是卢萨卡时间零点之后。"
        ),
      },
      {
        shot: "cn-receive",
        phone: true,
        title: t("Receiving cargo", "收货登记"),
        lede: t(
          "The most important screen you use. Everything downstream — the price, the invoice, the customer's tracking page — is built from what you type here.",
          "这是您最常用、也最重要的页面。后续的所有环节——价格、发票、客户的跟踪页面——都以您在此录入的内容为基础。"
        ),
        steps: [
          { do: t("Find the customer, or record a new one. Search by name, shipping mark, phone or customer ID.",
                  "查找客户，或登记新客户。可按姓名、唛头、电话或客户编号搜索。") },
          { do: t("Choose the cargo category. This is the only classification you make.",
                  "选择货物类别。这是您唯一需要做的分类。"),
            why: t("The system works out the airport and the price from the category — you do not set either.",
                   "系统会根据类别自动确定起运机场和价格——这两项都不需要您设置。") },
          { do: t("Choose the item from Which item, when the cargo is one clear thing.",
                  "如果货物品类明确，请在「具体品名」中选择。"),
            why: t("Finance prices a laptop differently from a box of cables. Not listed / mixed is an honest answer and is better than a wrong one.",
                   "财务对笔记本电脑和一箱数据线的计价方式不同。若不确定，选择「未列出／混装」是诚实的做法，好过选错。") },
          { do: t("Weigh the cargo before you type the weight.",
                  "先过磅，再录入重量。"),
            why: t("This weight is what the customer is billed on. Guessing it costs somebody money.",
                   "这个重量就是向客户计费的依据。凭感觉填写会让某一方蒙受损失。") },
          { do: t("Photograph the cargo. Every consignment, every time.",
                  "给货物拍照。每一票，每一次。") },
          { do: t("Save. The system prints a tracking number and a QR label for each carton.",
                  "保存。系统会生成运单号，并为每个纸箱生成二维码标签。") },
        ],
        warn: t(
          "Cargo with no photograph is the single most common cause of an argument you cannot win. If it arrives damaged, the photograph is the only thing that shows the condition it left in.",
          "没有照片的货物，是最常见、也最无法辩解的纠纷来源。一旦货物到达时有破损，照片是唯一能证明发货时状态的凭据。"
        ),
      },
      {
        shot: "cn-loading-tables",
        phone: true,
        title: t("The two loading tables", "两个装板台"),
        lede: t(
          "Cargo waiting to leave China sits on a loading table — one for Guangzhou, one for Hong Kong. There are exactly two and they never close.",
          "等待离开中国的货物放在装板台上——广州一个，香港一个。装板台固定为两个，永不关闭。"
        ),
        steps: [
          { do: t("Check which table your cargo is on. The system chooses it from the cargo category.",
                  "确认您的货物在哪个台上。系统会根据货物类别自动选择。") },
          { do: t("When a flight is ready, open the table and create the dispatch from it.",
                  "航班准备就绪后，打开该台并据此创建发运批次。") },
          {
            do: t("Read the table before you dispatch: pieces, packages, and the date the oldest piece was received.",
                  "发运前先看清台账：件数、包裹数，以及最早一件货物的收货日期。"),
          },
          {
            do: t("Dispatching closes that flight and leaves the table open and empty for the next one.",
                  "发运会关闭该航班，台账随即清空，继续接收下一批货物。"),
            why: t("There are exactly two loading tables and they are never deleted. A dispatch is a batch; the table carries on.",
                   "装货台账固定只有两张，永远不会被删除。发运生成的是一个批次，而台账本身继续使用。"),
          },
        ],
        note: t(
          "Normal goods and wigs fly Guangzhou. Electronics and special category fly Hong Kong. You do not choose the airport; the category does.",
          "普货和假发走广州，电子产品和特殊类别走香港。起运机场不由您选择，而由货物类别决定。"
        ),
      },
      {
        shot: "cn-search",
        title: t("Finding a consignment", "查找货物"),
        lede: t(
          "One box, and it accepts almost anything a customer might read out to you over the telephone.",
          "只有一个搜索框，客户在电话里报出的几乎任何信息都能用来查询。"
        ),
        steps: [
          { do: t("Type the tracking number with or without the dash. AT-000123 and at123 both work.",
                  "运单号可带横杠也可不带。AT-000123 与 at123 都能查到。") },
          { do: t("Or type the customer's name, their phone number, a batch number or an invoice number.",
                  "也可以输入客户姓名、电话号码、批次号或发票号。") },
          {
            do: t("Or scan the QR code on the label.",
                  "也可以扫描标签上的二维码。"),
            why: t("The scanner reads our own labels only. Anything else comes back as “That code is not a AITRANSIT label”.",
                   "扫码仅识别我方标签。其他二维码会提示“该码不是 AITRANSIT 标签”。"),
          },
          {
            do: t("The result tells you where the box is and whether it has been billed.",
                  "搜索结果会显示这件货物在哪里，以及是否已开单。"),
          },
        ],
      },
      {
        shot: "cn-customers",
        title: t("Customers", "客户"),
        lede: t(
          "Everyone the China desk has ever registered cargo for. Record a customer once and they are in the book from then on.",
          "中国操作台曾登记过货物的所有客户都在这里。客户只需登记一次，此后即可长期使用。"
        ),
        steps: [
          { do: t("Search before you create. A customer recorded twice becomes two credit limits and two histories.",
                  "新建之前请先搜索。同一客户被重复登记，会产生两个信用额度和两份历史记录。") },
          { do: t("Record the phone number in full, with the country code.",
                  "电话号码请完整填写，并带上国家区号。") },
          {
            do: t("Open a customer to see everything they have ever shipped and anything they still owe.",
                  "点开客户，可查看其历史全部发货记录以及尚未结清的欠款。"),
          },
          {
            do: t("Give the customer their customer code when you register them.",
                  "为客户建档时，请把客户编号告诉客户。"),
            why: t("It is what they will read out to you on the telephone when they cannot find the tracking number.",
                   "当客户找不到运单号时，会在电话里报这个编号。"),
          },
        ],
      },
      {
        shot: "cn-requests",
        title: t("Customer requests", "客户请求"),
        lede: t(
          "Bookings and collection requests a customer has sent from the website, waiting for the China desk to act on them.",
          "客户通过网站提交的预订和上门取货请求，等待中国操作台处理。"
        ),
        steps: [
          { do: t("Work the oldest first. A request is somebody waiting.",
                  "先处理最早的请求。每一条请求背后都有人在等待。") },
          { do: t("Confirm the supplier's address with the supplier before sending a driver.",
                  "派车之前，先与供应商确认取货地址。") },
          {
            do: t("A booking becomes cargo only when you register it. Until then it is a message, not a consignment.",
                  "只有在您完成登记后，预约才会成为货物记录。在此之前它只是一条信息，不是一票货。"),
          },
          {
            do: t("For a collection, open the map on the request and check the address is one a driver can reach.",
                  "对于上门取货，请打开请求中的地图，确认该地址司机能够到达。"),
          },
        ],
      },
    ],
  },

  /* ============================================= ZAMBIA WAREHOUSE ========= */
  {
    key: "zambia-warehouse",
    account: "warehouse@aitransit.co.zm",
    name: t("Zambia Warehouse", "赞比亚仓库"),
    subtitle: t(
      "Lusaka floor — check-in, storage and release",
      "卢萨卡现场 —— 入库、仓储与放货"
    ),
    owns: [
      t("Every consignment that lands is checked in and weighed on our own scale",
        "每一票到达的货物都要入库并用本公司的磅秤过磅"),
      t("The confirmed Lusaka weight is what the customer is billed on",
        "卢萨卡确认的重量就是向客户计费的依据"),
      t("Nothing leaves the counter without a scan against a valid pickup note",
        "未经扫描核对有效提货单，任何货物都不得离开柜台"),
    ],
    sections: [
      {
        shot: "zm-home",
        phone: true,
        title: t("Your home screen", "首页"),
        lede: t(
          "What has landed, what is still to be checked in, and what is waiting to be collected.",
          "已到货、待入库以及等待提取的货物一目了然。"
        ),
        steps: [
          { do: t("Start with anything arrived but not yet checked in. Until you check it in, it cannot be priced or collected.",
                  "先处理已到达但尚未入库的货物。未入库的货物无法计价，也无法提取。") },
          {
            do: t("Then work what is cleared but not collected.",
                  "接着处理已放行但尚未提走的货物。"),
            why: t("That cargo is already paid for and still taking up your floor. It is the cheapest space you will ever recover.",
                   "这些货物已经付过款却仍占用仓位。清走它们是成本最低的腾仓方式。"),
          },
          {
            do: t("Use the search box, or the scanner, for any box a customer is asking about.",
                  "客户询问某件货物时，使用搜索框或扫码枪查询。"),
          },
        ],
      },
      {
        shot: "zm-incoming",
        phone: true,
        title: t("Checking cargo in", "货物入库"),
        lede: t(
          "The moment cargo becomes real in Lusaka. Weigh it, confirm it, and the system prices it automatically as a draft for Finance to review.",
          "这是货物在卢萨卡正式入账的时刻。过磅并确认后，系统会自动生成价格草稿，交由财务复核。"
        ),
        steps: [
          { do: t("Weigh every consignment on our own scale.",
                  "每一票货物都要用本公司的磅秤过磅。"),
            why: t("The China weight is what the sender declared. The Lusaka weight is what the customer pays on.",
                   "中国端的重量是发货人申报的重量，卢萨卡的重量才是客户实际付费的依据。") },
          { do: t("Enter the confirmed weight and check the consignment in.",
                  "录入确认后的重量并完成入库。") },
          { do: t("Report anything short, damaged or missing straight away under Issues & Claims.",
                  "如发现短少、破损或丢失，请立即在「问题与索赔」中上报。") },
        ],
        warn: t(
          "Check-in starts the storage clock. Seven days are free; after that the customer is charged USD 2 a day. Checking cargo in late does not delay the charge — it just means the count started without anybody watching.",
          "入库即开始计算仓储时间。前 7 天免费，之后每天收取 2 美元。延迟入库并不会推迟收费，只会让计时在无人留意的情况下开始。"
        ),
      },
      {
        shot: "zm-arrived",
        title: t("Arrived batches", "已到批次"),
        lede: t(
          "Every dispatch that has left China. Open one to see its cargo, its documents and its full timeline.",
          "所有已从中国发出的批次。点开即可查看该批次的货物、单证和完整时间线。"
        ),
        steps: [
          { do: t("Use the tabs to separate what is in transit from what is already on your floor.",
                  "使用标签页区分在途货物和已到达现场的货物。") },
          {
            do: t("Open a batch to see every consignment on it, with its China weight and its packing list.",
                  "点开批次，可查看其中每一票货物，包括中国称重和装箱清单。"),
          },
          {
            do: t("Check the batch documents before you start unloading, so you know what you are counting against.",
                  "开始卸货前先核对批次单据，这样清点时才有依据。"),
          },
          {
            do: t("Cargo still in China is not here. It is on a loading table, and it appears once the flight is dispatched.",
                  "仍在中国的货物不在此处。它们还在装货台账上，航班发运后才会出现。"),
          },
        ],
      },
      {
        shot: "zm-release",
        phone: true,
        title: t("Releasing cargo", "放货"),
        lede: t(
          "The one control that stops cargo going to the wrong person. Scan the QR label on the box against the customer's pickup note.",
          "这是防止货物错发的唯一关键环节。用箱上的二维码标签与客户的提货单进行扫描核对。"
        ),
        steps: [
          { do: t("Ask for the pickup note. It is on the customer's phone or printed.",
                  "向客户索取提货单，可以是手机上的电子版或打印件。") },
          { do: t("Scan the QR label on each carton.",
                  "扫描每个纸箱上的二维码标签。") },
          { do: t("Record who collected it, and their relationship to the customer.",
                  "记录提货人姓名及其与客户的关系。"),
            why: t("The system asks whether they are the customer, family, an employee or an agent. Write down which, because that is the answer to the argument six weeks later.",
                   "系统会询问提货人是客户本人、家属、员工还是代理。务必如实选择——六周后一旦出现争议，靠的就是这条记录。") },
          { do: t("Take the delivery photograph before the cargo leaves the counter.",
                  "货物离柜前，先拍摄放货照片。"),
            why: t("It is the only proof of what was handed over, and of the condition it was in.",
                   "这是证明交付了什么、以及交付时状态如何的唯一凭据。") },
          { do: t("If the customer is only taking some of the boxes, release only those.",
                  "如果客户只提走部分箱数，就只放行这部分。"),
            why: t("The screen counts them for you — “Boxes here: 2 of 3”. The rest stay on the floor and stay your responsibility.",
                   "屏幕会自动计数——“在场箱数：2 / 3”。其余箱数仍留在仓库，仍由您负责。") },
        ],
        warn: t(
          "Never release against a name, a phone call or a screenshot of a message. The scan is the check. If the note will not scan, the cargo does not leave — send them to the office.",
          "绝不可仅凭姓名、电话或聊天截图放货。扫描核对才是唯一凭据。如果提货单无法扫描，货物一律不得放行，请让客户前往办公室处理。"
        ),
      },
      {
        shot: "zm-inventory",
        title: t("What is on the floor", "现场库存"),
        lede: t(
          "Everything physically in the Lusaka warehouse right now, and how long each consignment has been sitting there.",
          "当前实际存放在卢萨卡仓库的全部货物，以及每票货物已存放的天数。"
        ),
        steps: [
          { do: t("Watch anything approaching seven days. Tell Customer Support before the storage charge starts, not after.",
                  "留意接近 7 天的货物。请在仓储费开始计收之前通知客服，而不是之后。") },
          {
            do: t("Sort by longest sitting to find the cargo that has been here the longest.",
                  "按“存放最久”排序，即可找出滞留时间最长的货物。"),
          },
          {
            do: t("“Stored, waiting on Finance” means the customer has not paid. “Cleared for pickup” means they can take it today.",
                  "“已入库，待财务处理”表示客户尚未付款。“已放行待提”表示客户当天即可提货。"),
          },
          {
            do: t("Tell Customer Support who to ring.",
                  "把需要催提的客户告诉客服部。"),
            why: t("You are the only person who can see the floor. Nobody else knows a box has been sitting there for nine days.",
                   "只有您能看到仓库实况。某件货物已经放了九天，其他人并不知道。"),
          },
        ],
      },
    ],
  },

  /* ======================================================= FINANCE ======== */
  {
    key: "finance",
    account: "finance@aitransit.co.zm",
    name: t("Finance", "财务部"),
    subtitle: t(
      "Pricing, invoices, payments, credit and the money desk",
      "计价、发票、收款、赊账与货币业务"
    ),
    owns: [
      t("Every consignment is priced from the published rate book, not by hand",
        "每一票货物都按公布的价目表计价，不得手工定价"),
      t("Every payment names the account the money landed in",
        "每一笔收款都必须注明款项进入的账户"),
      t("Credit is a decision with a name against it, never a favour",
        "赊账是一项有责任人签字的决定，绝非人情"),
    ],
    sections: [
      {
        shot: "fi-overview",
        phone: true,
        title: t("Finance overview", "财务总览"),
        lede: t(
          "What is owed, what has been collected, and what is still to be priced.",
          "应收多少、已收多少、以及还有多少尚未计价。"
        ),
        steps: [
          {
            do: t("Read the top row first: cash available, expected to come in, out this month.",
                  "先看最上面一行：可用资金、预计将收入、本月支出。"),
            why: t("The kwacha figure is the big one. The dollar line under it is the same money, converted at the invoice rate.",
                   "醒目的数字是克瓦查金额。下方的美元行是同一笔钱，按发票汇率折算。"),
          },
          {
            do: t("Check the batch strip: still open, with the desk, confirmed.",
                  "查看批次栏：仍未关闭、待财务处理、已确认。"),
            why: t("A batch that is not confirmed has not been fully priced, so its profit figure is not final.",
                   "未确认的批次尚未完成计价，其利润数字并非最终数字。"),
          },
          {
            do: t("Work the “Needs you” list — unpaid bills, and cargo cleared but not collected.",
                  "处理“需要您处理”列表——未付账单，以及已放行但尚未提走的货物。"),
          },
          {
            do: t("Record money from the four buttons as it happens: an income, a cost, a movement between accounts, a cash count.",
                  "资金一发生就用这四个按钮记录：收入、支出、账户间转账、现金盘点。"),
          },
        ],
      },
      {
        shot: "fi-pricing",
        title: t("The rate book", "价目表"),
        lede: t(
          "Every price the system quotes comes from here. Change it here and every future quote changes with it.",
          "系统报出的每一个价格都来自这里。在此修改后，之后的所有报价都会随之变化。"
        ),
        steps: [
          { do: t("Set a rate per category, per weight band.",
                  "按类别、按重量区间设置单价。") },
          { do: t("Use a product rule when one item needs its own price.",
                  "如需对某个具体品名单独定价，请使用品名规则。"),
            why: t("A product rule beats the category rate for that item and leaves everything else alone.",
                   "品名规则的优先级高于类别价格，且只影响该品名，不影响其他货物。") },
          {
            do: t("Check when the price was last changed, and by whom, before you change it again.",
                  "再次修改价格前，请先查看上次修改的时间和修改人。"),
          },
          {
            do: t("Withdraw a price you no longer offer rather than deleting it.",
                  "不再提供的价格请设为“撤回”，不要删除。"),
            why: t("A withdrawn price stays visible under “Show withdrawn”, so an old invoice can still be explained.",
                   "撤回的价格仍可通过“显示已撤回”查看，便于日后解释旧发票。"),
          },
        ],
        warn: t(
          "Changing a rate never changes an invoice that already exists. A confirmed invoice keeps the rate it was raised at, forever. That is deliberate: a customer who was quoted a figure must still see that figure in six months.",
          "修改价格不会影响已经生成的发票。已确认的发票将永久保留开具时的价格。这是刻意设计的：向客户报过的数字，半年后客户仍应看到同样的数字。"
        ),
      },
      {
        shot: "fi-credit",
        phone: true,
        title: t("Credit", "赊账审批"),
        lede: t(
          "A customer asking to collect now and pay later. Approving it releases the cargo with the bill unpaid.",
          "客户申请先提货、后付款。批准后，货物将在未结清账款的情况下放行。"
        ),
        steps: [
          { do: t("Check what the customer already owes before you approve anything.",
                  "批准之前，先查看该客户当前的欠款情况。") },
          { do: t("Set a term. Credit without a due date is not credit.",
                  "设定账期。没有到期日的赊账不算赊账。") },
          { do: t("Approve or reject with a reason. Both are recorded against your name.",
                  "批准或拒绝时都要填写理由。两者都会以您的名义记录在案。") },
        ],
      },
      {
        shot: "fi-accounts",
        title: t("Company accounts", "公司账户"),
        lede: t(
          "Five accounts: office cash in USD and ZMW, bank in USD and ZMW, and mobile money. One account holds exactly one currency.",
          "共五个账户：美元和克瓦查现金、美元和克瓦查银行账户、以及移动支付账户。每个账户只持有一种货币。"
        ),
        steps: [
          {
            do: t("Set each account's opening balance once, on the day you start using the system.",
                  "在系统启用当天，为每个账户设置一次期初余额。"),
            why: t("Until you do, the balance shown is only what this system has recorded — not what is actually in the account.",
                   "在此之前，此处显示的余额仅为本系统已记录的金额，并非账户中的实际金额。"),
          },
          {
            do: t("Make every payment name the account the money landed in.",
                  "每一笔收款都必须注明款项进入了哪个账户。"),
          },
          {
            do: t("Count the cash tin at the end of each day and record the count here.",
                  "每天下班前清点现金箱，并在此记录盘点结果。"),
          },
        ],
        warn: t(
          "Always record which account the money actually landed in. A balance in this system is a running total of movements, not a number somebody typed — an unattributed payment is money the books cannot see.",
          "务必记录款项实际到账的账户。系统中的余额是由每一笔资金流动累计而成，而不是有人手工填写的数字——未指明账户的收款，账面上等于看不见。"
        ),
      },
      {
        shot: "fi-collections",
        phone: true,
        title: t("Collections", "催收"),
        lede: t(
          "Who owes what, and for how long. The chase list.",
          "谁欠了多少、欠了多久。这就是催收清单。"
        ),
        steps: [
          {
            do: t("Work the Overdue column first, then Due today, then Due this week.",
                  "先处理“逾期”，再处理“今日到期”，然后是“本周到期”。"),
          },
          {
            do: t("Open a row to see the invoice, and what the customer owes in cash and on credit.",
                  "点开某一行，查看发票以及该客户的现金欠款和赊账欠款。"),
          },
          {
            do: t("Ring or message from the row itself.",
                  "直接在该行拨打电话或发送消息。"),
            why: t("The WhatsApp message goes out with the tracking number and the amount already in it, so the customer does not have to ask what it is for.",
                   "WhatsApp 消息会自动带上运单号和金额，客户无需再询问这笔钱是什么。"),
          },
          {
            do: t("Record the payment on the same row the moment the money lands, and name the account.",
                  "款项一到账，就在同一行记录收款，并注明收款账户。"),
          },
        ],
      },
      {
        shot: "fi-pickup-notes",
        phone: true,
        title: t("Pickup notes", "提货单"),
        lede: t(
          "The document that lets cargo leave the counter. Issued when a bill is paid, or when credit has been approved.",
          "允许货物离开柜台的凭证。在账款结清或赊账获批后开具。"
        ),
        steps: [
          { do: t("Issue the note only once the money is recorded or the credit is approved.",
                  "只有在收款已入账或赊账已获批后，才可开具提货单。") },
          {
            do: t("Find a note by its number, the customer, their phone number or the tracking number.",
                  "可按提货单号、客户、电话号码或运单号查找提货单。"),
          },
          {
            do: t("Print it, or send it on WhatsApp. The customer needs it at the counter.",
                  "打印提货单，或通过 WhatsApp 发送。客户提货时需要出示。"),
          },
          {
            do: t("Cancel a note issued in error. Never issue a second note for the same cargo.",
                  "开错的提货单请作废。切勿为同一票货物开具第二张提货单。"),
            why: t("Two live notes for one consignment is how a box gets handed over twice.",
                   "同一票货存在两张有效提货单，就会导致货物被重复放行。"),
          },
        ],
      },
      {
        shot: "fi-money-desk",
        phone: true,
        title: t("Money desk", "货币业务台"),
        lede: t(
          "Currency bookings customers have made on the website. A booking is a request, never a completed transfer.",
          "客户在网站上提交的换汇预约。预约只是申请，不等于已完成的转账。"
        ),
        steps: [
          { do: t("Confirm the rate with the customer before anything moves.",
                  "在任何资金操作之前，先与客户确认汇率。") },
          {
            do: t("Record the rate you agreed. The booking then waits for their funds.",
                  "记录双方约定的汇率。随后该笔业务进入“等待客户付款”状态。"),
          },
          {
            do: t("When the money arrives, name the account it landed in, and confirm.",
                  "款项到账后，注明进账账户，然后确认。"),
            why: t("Confirming fixes the rate. That is the moment the booking becomes a transaction.",
                   "确认即锁定汇率。此时该笔预约才成为一笔真实交易。"),
          },
          {
            do: t("Cancel a booking the customer never funded. Do not leave it open.",
                  "客户始终未付款的预约请取消，不要长期挂着。"),
          },
        ],
      },
      {
        shot: "fi-fx-board",
        title: t("Exchange board", "汇率牌价"),
        lede: t(
          "What the public exchange page shows. Publish the rates every morning.",
          "对外公布的汇率页面所显示的内容。每天早上发布当日牌价。"
        ),
        steps: [
          {
            do: t("The published pairs are what customers see on the website. They are for display.",
                  "已发布的货币对是客户在网站上看到的汇率，仅用于展示。"),
          },
          {
            do: t("The invoice exchange rate is a different number, and it is set on the Money desk.",
                  "发票汇率是另一个数字，需在“资金台”中设置。"),
            why: t("That is the rate every invoice is converted at. Changing the board does not change a single invoice.",
                   "发票汇率才是所有发票的折算依据。修改展示牌不会改动任何一张发票。"),
          },
          {
            do: t("Hide a pair rather than deleting it when you stop quoting it.",
                  "不再报价某个货币对时，请将其隐藏，而不要删除。"),
          },
        ],
        warn: t(
          "A rate the system seeded is marked Indicative and nobody has stood behind it. Confirm it before you trade at it — the customer-facing page says so beside every pair.",
          "系统预置的汇率标记为「参考价」，尚无人负责确认。实际交易前请先确认——对外页面已在每个币种旁注明这一点。"
        ),
      },
      {
        shot: "fi-supplier-payments",
        phone: true,
        title: t("Supplier payments", "供应商付款"),
        lede: t(
          "Customers asking us to pay their factory in RMB. Check the details before anything is sent.",
          "客户委托我们以人民币向其工厂付款。汇出前请务必核对信息。"
        ),
        steps: [
          {
            do: t("Record what was paid to the supplier in China, in the currency it was actually paid in.",
                  "记录支付给中国供应商的款项，并使用实际支付时所用的币种。"),
          },
          {
            do: t("Attach the proof — the transfer screenshot or the receipt.",
                  "上传付款凭证——转账截图或收据。"),
          },
          {
            do: t("A payment stays pending until somebody confirms the money went out.",
                  "在有人确认款项已实际支出之前，该笔付款一直处于“待确认”状态。"),
          },
        ],
        warn: t(
          "Copy the supplier's bank details exactly as the customer sent them. We check before paying, but we cannot correct a digit nobody can see is wrong.",
          "请完全按照客户提供的内容录入供应商的银行信息。我们会在付款前核对，但无法发现并纠正一个看不出错的数字。"
        ),
      },
      {
        shot: "fi-ledger",
        title: t("General ledger", "总账"),
        lede: t(
          "Every movement of money, in one register, in the order it happened.",
          "所有资金流动按发生顺序汇总在一个账簿中。"
        ),
        steps: [
          {
            do: t("Filter by account, by type or by date to find a movement.",
                  "按账户、类型或日期筛选，以查找某笔资金变动。"),
          },
          {
            do: t("Every line names the account the money moved through and the person who recorded it.",
                  "每一行都注明了资金经过的账户以及记录人。"),
          },
          {
            do: t("To correct a mistake, cancel the movement and record it again.",
                  "如需更正错误，请先作废该笔记录，然后重新录入。"),
            why: t("The original stays visible. The ledger is a record of what happened, including what was corrected.",
                   "原记录仍然可见。总账记录的是实际发生过的事，包括被更正的部分。"),
          },
        ],
      },
    ],
  },

  /* ============================================== CUSTOMER SUPPORT ======== */
  {
    key: "customer-support",
    account: "support@aitransit.co.zm",
    name: t("Customer Support", "客户服务"),
    subtitle: t(
      "Answering customers, tickets, appointments and claims",
      "客户咨询、工单、预约与索赔"
    ),
    owns: [
      t("A customer asking where their cargo is gets an accurate answer, not a guess",
        "客户询问货物在哪里时，必须得到准确答复，而非猜测"),
      t("Every promise made to a customer is recorded where the next person can see it",
        "对客户作出的每一项承诺都要记录在下一位同事能看到的地方"),
      t("Problems are raised as claims, not settled quietly over the telephone",
        "问题应作为索赔正式提交，而不是在电话里私下解决"),
    ],
    sections: [
      {
        shot: "cs-home",
        phone: true,
        title: t("Your home screen", "首页"),
        lede: t(
          "What customers are waiting on, and what has gone wrong that somebody needs to explain.",
          "客户正在等待的事项，以及已经出问题、需要有人解释的情况。"
        ),
        steps: [
          {
            do: t("Start on “Needs your attention”. It is your queue for the day, worst first.",
                  "从“需要您处理”开始。这是您当天的工作队列，最紧急的排在最前。"),
          },
          {
            do: t("Use the search box at the top for a tracking number, a phone number or a customer name.",
                  "使用顶部的搜索框，可按运单号、电话号码或客户姓名查找。"),
          },
          {
            do: t("Every call starts from one of two things: the cargo, or the person.",
                  "每一通来电都从两者之一入手：货物，或客户本人。"),
            why: t("Find the cargo when they have a tracking number. Find the customer when they do not.",
                   "客户有运单号时就查货物；没有运单号时就查客户。"),
          },
        ],
      },
      {
        shot: "cs-search",
        phone: true,
        title: t("Answering \"where is my cargo?\"", "回答「我的货在哪里？」"),
        lede: t(
          "The question you will be asked more than any other. One search box answers it.",
          "这是您被问得最多的问题。一个搜索框就能回答。"
        ),
        steps: [
          { do: t("Ask for the tracking number. If they do not have it, search their name or phone number.",
                  "先索取运单号。如果客户没有，可用姓名或电话号码查询。") },
          { do: t("Read them the status and the location, and tell them what happens next.",
                  "向客户说明当前状态和所在位置，并告知下一步会发生什么。") },
          {
            do: t("If the box has not been checked in at Lusaka yet, say so plainly, and give the batch it is on.",
                  "如果货物尚未在卢萨卡入库，请如实告知客户，并说明它在哪个批次上。"),
          },
          {
            do: t("Never guess a date. Read the customer what the system says.",
                  "切勿凭猜测告知日期。请按系统显示的内容如实告知客户。"),
            why: t("A date you invented is a date the customer will hold you to.",
                   "您随口说出的日期，客户会当作承诺。"),
          },
        ],
        note: t(
          "The customer can see the same information themselves on the tracking page, without signing in. Telling them so saves the next telephone call.",
          "客户无需登录，即可在跟踪页面自行查看相同信息。告知这一点可以减少下一次来电。"
        ),
      },
      {
        shot: "cs-tickets",
        phone: true,
        title: t("Tickets", "工单"),
        lede: t(
          "A question or a complaint that is not finished yet. Keep it open until it actually is.",
          "尚未处理完毕的咨询或投诉。在真正解决之前，请保持工单开启。"
        ),
        steps: [
          { do: t("Write what you told the customer, not just what they asked.",
                  "不仅要记录客户问了什么，更要记录您答复了什么。"),
            why: t("The next person to speak to them needs to know what they were already promised.",
                   "下一位接待该客户的同事，需要知道之前已经向客户承诺了什么。") },
          {
            do: t("Set the category and the priority when you open the ticket.",
                  "创建工单时，设置好类别和优先级。"),
            why: t("High and urgent tickets rise to the top of somebody's day. Marking everything urgent means nothing is.",
                   "高优先级和紧急工单会排到最前面。如果什么都标为紧急，就等于没有紧急。"),
          },
          {
            do: t("Put your name on it, so the customer speaks to the same person twice.",
                  "把工单指派到自己名下，让客户两次沟通面对同一个人。"),
          },
          {
            do: t("Close it when the customer's problem is finished, not when your part of it is.",
                  "客户的问题彻底解决后才关闭工单，而不是您这一环节做完就关闭。"),
          },
        ],
      },
      {
        shot: "cs-appointments",
        phone: true,
        title: t("Appointments", "预约"),
        lede: t(
          "Cargo pickups in Makeni, and market or factory visits in Guangzhou.",
          "在马克尼的提货预约，以及在广州的市场或工厂参观预约。"
        ),
        steps: [
          { do: t("For a pickup, check the cargo is actually ready before you confirm a day.",
                  "确认提货日期之前，先核实货物确实已经备妥。") },
          { do: t("For a market visit, check the market is open and put somebody with them.",
                  "安排市场参观前，确认市场开门并安排陪同人员。") },
          {
            do: t("Record where they want to be met, and the phone number to ring on the day.",
                  "记录客户希望的会面地点，以及当天可拨打的电话号码。"),
          },
          {
            do: t("Write our note on the booking after the visit.",
                  "拜访结束后，在该预约上填写我方备注。"),
            why: t("The next person to speak to that customer needs to know how it went.",
                   "下一位对接该客户的同事，需要知道这次拜访的结果。"),
          },
        ],
      },
      {
        shot: "cs-exceptions",
        title: t("Issues & claims", "问题与索赔"),
        lede: t(
          "Cargo that is missing, short, damaged or under investigation.",
          "丢失、短少、破损或正在调查中的货物。"
        ),
        steps: [
          {
            do: t("Open a case against the cargo and choose the kind: damage, packaging, arrival or missing cargo.",
                  "针对该货物创建案件，并选择类型：破损、包装、到货或货物遗失。"),
          },
          {
            do: t("Put your name on it.",
                  "将案件指派到您自己名下。"),
            why: t("A case with nobody carrying it is a case nobody is working.",
                   "无人负责的案件，就是无人跟进的案件。"),
          },
          {
            do: t("Write down what you told the customer, every time you tell them something.",
                  "每次向客户说明情况后，都要把说过的内容记录下来。"),
          },
          {
            do: t("Close the case only when the cargo is found, or Finance has recorded the payout.",
                  "只有在货物找到、或财务已记录赔付后，才可关闭案件。"),
          },
        ],
        warn: t(
          "While a case is open the customer cannot collect and their balance is frozen. That is correct — but it means an open case somebody forgot about is a customer who cannot get their goods. Close what is finished.",
          "案件处理期间，客户无法提货，其账款也会被冻结。这是正确的机制——但也意味着一个被遗忘的未结案件，会让客户始终拿不到货。请及时关闭已处理完毕的案件。"
        ),
      },
      {
        shot: "cs-customers",
        title: t("Customers", "客户"),
        lede: t(
          "Everyone on the books, with their cargo, their invoices and what they owe.",
          "所有在册客户，及其货物、发票与欠款情况。"
        ),
        steps: [
          {
            do: t("Search by name, customer ID, phone number or city.",
                  "可按姓名、客户编号、电话号码或城市搜索。"),
          },
          {
            do: t("Open a customer to see every consignment, every invoice, and what they owe.",
                  "点开客户，可查看其全部货物、全部发票以及欠款情况。"),
          },
          {
            do: t("Correct a phone number here, on the customer, not on the cargo.",
                  "更正电话号码请在客户资料中修改，而不是在货物记录中修改。"),
            why: t("The customer record is what every reminder and every WhatsApp message is sent to.",
                   "所有催款提醒和 WhatsApp 消息都发送到客户资料中的号码。"),
          },
        ],
      },
      {
        shot: "cs-markets",
        title: t("China markets", "中国市场"),
        lede: t(
          "The sourcing directory customers ask about — which market sells what, in which city.",
          "客户经常咨询的采购指南——哪个市场、位于哪个城市、经营什么商品。"
        ),
        steps: [
          {
            do: t("Use the directory when a customer asks where to buy something in China.",
                  "客户询问在中国何处采购某类商品时，使用该目录查询。"),
          },
          {
            do: t("Each entry shows what the market sells and when it opens.",
                  "每条记录都显示该市场经营的商品以及营业时间。"),
          },
          {
            do: t("Send the customer the market's address and our warehouse address together.",
                  "把市场地址和我们的仓库地址一并发送给客户。"),
            why: t("The supplier needs the warehouse address to deliver to, and it is the commonest thing a first-time customer forgets to ask for.",
                   "供应商需要仓库地址才能送货，而这恰恰是新客户最常忘记索取的信息。"),
          },
        ],
      },
    ],
  },

  /* ========================================================= ADMIN ======== */
  {
    key: "admin",
    account: "admin@aitransit.co.zm",
    name: t("Admin", "管理员"),
    subtitle: t(
      "Oversight of operations, money, people and prices",
      "对运营、资金、人员与价格的全面监管"
    ),
    owns: [
      t("Every figure the business reports can be traced back to the rows underneath it",
        "企业报告中的每一个数字都能追溯到其底层明细"),
      t("Who may do what, and the record of what they did",
        "谁有权做什么，以及他们做过什么的完整记录"),
      t("Prices, exchange rates and company settings",
        "价格、汇率与公司设置"),
    ],
    sections: [
      {
        shot: "ad-dashboard",
        phone: true,
        title: t("The dashboard", "总览看板"),
        lede: t(
          "The whole business on one screen — cargo, revenue, collections and what is overdue.",
          "在一个页面上掌握整体经营情况——货量、收入、回款以及逾期事项。"
        ),
        steps: [
          {
            do: t("The top row is today: cargo registered, billed, collected.",
                  "最上面一行是当天数据：登记货量、开单金额、已收金额。"),
          },
          {
            do: t("“Collected against billed” is the number to watch.",
                  "重点关注“已收 / 已开单”这一比例。"),
            why: t("Billing that is not collected is not revenue. A month can bill well and still run out of cash.",
                   "开了单但没收到钱，不算收入。某个月开单很多，仍可能出现资金短缺。"),
          },
          {
            do: t("The charts below cover the month; the batch table shows profit for each flight.",
                  "下方图表反映整月情况；批次表显示每一班航班的利润。"),
          },
        ],
      },
      {
        shot: "ad-admin",
        phone: true,
        title: t("Admin home", "管理首页"),
        lede: t(
          "Everything that governs how the system behaves, in one place.",
          "所有决定系统运行方式的设置，集中在此处。"
        ),
        steps: [
          {
            do: t("The attention panel lists what is going wrong right now.",
                  "关注面板列出当前正在出问题的事项。"),
          },
          {
            do: t("“Accounts to check” is the reconciliation queue.",
                  "“待核对账户”是对账队列。"),
            why: t("These are accounts whose recorded balance has not been checked against the real one lately.",
                   "这些账户的系统余额，近期尚未与实际余额进行核对。"),
          },
          {
            do: t("The admin actions are shortcuts to users, prices, reports and settings.",
                  "管理操作是通往用户、价格、报表和设置的快捷入口。"),
          },
        ],
      },
      {
        shot: "ad-users",
        phone: true,
        title: t("Users and permissions", "用户与权限"),
        lede: t(
          "Who can sign in, what department they belong to, and therefore what they can see.",
          "谁可以登录、属于哪个部门，以及由此决定他们能看到什么。"
        ),
        steps: [
          { do: t("Give a person the department they actually work in. Permissions follow the department.",
                  "为员工分配其实际所在的部门。权限随部门自动确定。") },
          { do: t("Deactivate somebody who has left the same day they leave.",
                  "员工离职当天即停用其账号。") },
          {
            do: t("Set an employee ID, and a rank for warehouse staff.",
                  "为员工设置工号；仓库人员还需设置级别。"),
            why: t("Rank applies to warehouse staff only. It separates the person doing the work from the person signing it off.",
                   "级别仅适用于仓库人员，用于区分具体操作人和签核人。"),
          },
          {
            do: t("Reset a password rather than sharing one.",
                  "需要时请重置密码，不要共用账号密码。"),
            why: t("Every action in the activity log is stamped with whoever was signed in. A shared login makes that log worthless.",
                   "活动日志会记录每个操作的登录人。共用账号会让日志失去意义。"),
          },
        ],
        warn: t(
          "There is no Manager role in AITRANSIT. Everything the second chair used to hold sits with Admin, so there is exactly one desk that answers for the figures.",
          "AITRANSIT 没有「经理」这一角色。原先由第二责任人掌握的全部权限都归属管理员，确保只有一个岗位对数据负责。"
        ),
      },
      {
        shot: "ad-pricing",
        title: t("Prices and categories", "价格与类别"),
        lede: t(
          "The rate book and the cargo catalogue. What the business charges, and for what.",
          "价目表与货物品名库。规定收什么费、按什么收。"
        ),
        steps: [
          {
            do: t("This opens the Finance rate book. It is the same page and the same prices.",
                  "此处打开的是财务价目表。与财务部使用的是同一个页面、同一套价格。"),
          },
          {
            do: t("Change a category rate to change what every future quote charges.",
                  "修改类别单价，即可改变之后所有报价的收费标准。"),
          },
          {
            do: t("Use a product rule when one item needs its own price.",
                  "如需对某个具体品名单独定价，请使用品名规则。"),
            why: t("A product rule beats the category rate for that item and leaves everything else alone.",
                   "品名规则的优先级高于类别价格，且只影响该品名，不影响其他货物。"),
          },
        ],
      },
      {
        shot: "ad-reconciliation",
        title: t("Reconciliation", "对账"),
        lede: t(
          "Whether what the books say matches what the accounts actually hold.",
          "核对账面记录与账户实际余额是否一致。"
        ),
        steps: [
          {
            do: t("Pick the account and the date you are checking.",
                  "选择要核对的账户和日期。"),
          },
          {
            do: t("Enter the real balance — from the bank statement, or from counting the tin.",
                  "输入实际余额——来自银行对账单，或现金盘点结果。"),
          },
          {
            do: t("The page shows whether it agrees, and by how much it is apart.",
                  "页面会显示是否相符，以及相差多少。"),
          },
          {
            do: t("Record the check either way.",
                  "无论是否相符，都要保存本次核对记录。"),
            why: t("A check that found a difference is worth more than no check at all — it dates the problem.",
                   "查出差异的核对，比不做核对有价值得多——它能确定问题出现的时间。"),
          },
        ],
      },
      {
        shot: "ad-reports",
        title: t("Reports and profit & loss", "报表与损益"),
        lede: t(
          "What each batch earned, what it cost, and what the business made.",
          "每个批次的收入、成本以及最终利润。"
        ),
        steps: [
          {
            do: t("Choose the report, then the period it covers.",
                  "先选择报表，再选择统计期间。"),
          },
          {
            do: t("Read it on screen, or download it to Excel.",
                  "可在屏幕上查看，也可下载为 Excel。"),
          },
          {
            do: t("Print from the page when the report needs a signature.",
                  "报表需要签字时，请直接从页面打印。"),
          },
        ],
        note: t(
          "Sample records are prefixed AT-DEMO- and DEMO-AIT-. Exclude them before you quote a figure to anybody outside the company.",
          "示例数据以 AT-DEMO- 和 DEMO-AIT- 为前缀。向公司外部提供任何数字之前，请先排除这些数据。"
        ),
      },
      {
        shot: "ad-audit",
        title: t("The activity log", "操作日志"),
        lede: t(
          "Who did what, and when. Nothing in this system happens anonymously.",
          "谁在什么时候做了什么。本系统中没有任何操作是匿名的。"
        ),
        steps: [
          {
            do: t("Filter by record type — cargo, invoice, payment, batch, pickup note.",
                  "按记录类型筛选——货物、发票、收款、批次、提货单。"),
          },
          {
            do: t("Or search a person's name to see everything one member of staff did.",
                  "也可以搜索姓名，查看某位员工做过的全部操作。"),
          },
          {
            do: t("Nothing here can be edited or deleted.",
                  "此处的记录无法修改，也无法删除。"),
            why: t("That is the whole point of the log. It is the record you reach for when two people remember a day differently.",
                   "这正是日志存在的意义。当两个人对同一天的记忆不一致时，就靠它来查证。"),
          },
        ],
      },
      {
        shot: "ad-settings",
        phone: true,
        title: t("Company settings", "公司设置"),
        lede: t(
          "Addresses, contacts, storage policy and the details that appear on every invoice.",
          "地址、联系方式、仓储政策，以及出现在每张发票上的信息。"
        ),
        steps: [
          {
            do: t("Set the company address and phone numbers.",
                  "填写公司地址和联系电话。"),
            why: t("These print on every invoice and every pickup note, and they show on the public website.",
                   "这些信息会打印在每一张发票和提货单上，并显示在公开网站上。"),
          },
          {
            do: t("Add the accounts customers can pay into — bank, Airtel Money, MTN.",
                  "添加客户可付款的账户——银行、Airtel Money、MTN。"),
            why: t("Write the label exactly as the customer should read it, so nobody has to guess what kind of number it is.",
                   "标签要按客户看到的原样填写，避免客户猜测这是哪一类账号。"),
          },
          {
            do: t("Name the cargo categories the way your staff say them out loud.",
                  "货物类别的命名，应与员工日常口头称呼一致。"),
          },
          {
            do: t("Save. The change takes effect on the next document raised.",
                  "保存。修改将在下一份生成的单据上生效。"),
          },
        ],
      },
    ],
  },
];
