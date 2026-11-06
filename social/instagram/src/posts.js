// LoWa Studio, Instagram series. Every slide is 1080x1350 (4:5).
// Copy rules: no em dashes, no invented numbers, testimonials or results. [Brackets] = pending from Sarah.

const Wimg = (pose, css) => `<img class="walter" src="walter/${pose}.png" style="${css}" alt="">`;
const BR = (img, host, css = "") => `<div class="browser" style="${css}"><div class="bar"><i></i><i></i><i></i><span>${host}</span></div><img src="${img}"></div>`;
const PH = (img, css = "") => `<div class="phone" style="${css}"><img src="${img}"></div>`;
const big = (t) => `<div style="position:absolute;right:-10px;bottom:-110px;font-family:'Instrument Serif',serif;font-style:italic;font-size:640px;line-height:1;letter-spacing:-.04em;color:var(--acc)">${t}</div>`;
const stamp = (css) => `<div class="stamp" style="${css}"><div><b>24h</b><small>Human<br>directed</small></div></div>`;

const cta = (theme, title = "Your clients could have <em>one of these.</em>", pose = "09") => ({
  type: "raw", theme,
  html: `<div class="mono kick">Work with us</div>
  <h2 style="font-size:112px">${title}</h2>
  <p class="body" style="margin-top:38px;max-width:640px">LoWa Studio is the production team behind US agencies. We build, you sell, and you keep the client relationship.</p>
  <div class="chip" style="margin-top:44px">Briefing link in bio →</div>
  ${Wimg(pose, "width:470px;right:-30px;bottom:-40px")}`,
});

// ---------- Portfolio: one post per project ----------
function folio(o) {
  const sh = (k) => `shots/${o.id}-${k}.png`;
  const hero = o.hero || sh("d0");
  const titleSize = o.titleSize || 140;
  const slides = [
    { type: "raw", theme: o.theme, pad: 56, html: `
      <div class="mono kick">${o.kicker || "Selected work"} · ${o.tag}</div>
      <h1 style="font-size:${titleSize}px">${o.nameHtml || o.name}</h1>
      ${o.coverPhone
        ? `<div style="position:absolute;left:0;right:0;bottom:-120px;display:flex;justify-content:center;gap:40px">${PH(sh("m0"), "transform:rotate(-4deg)")}${PH(sh("m1"), "transform:rotate(4deg) translateY(60px)")}</div>`
        : `<div style="position:absolute;left:-6px;right:-6px;bottom:10px;transform:rotate(-2deg)">${BR(hero, o.host)}</div>`}
      ${o.badge ? `<div class="stamp" style="right:-10px;top:250px;background:var(--cream)"><div><b style="font-size:46px">${o.badge[0]}</b><small>${o.badge[1]}</small></div></div>` : ""}` },
    { type: "raw", theme: o.theme2 || "cream", html: `
      <div class="mono kick">${o.briefKick || "The brief"}</div>
      <h2 style="font-size:96px">${o.headline}</h2>
      <p class="body" style="margin-top:38px">${o.text}</p>
      <div class="facts">
        <div><span class="mono">Delivery</span><b>${o.type}</b></div>
        <div><span class="mono">Field</span><b>${o.field || o.tag}</b></div>
        <div><span class="mono">Status</span><b>${o.status || "Live"}</b></div>
        <div><span class="mono">Address</span><b style="font-size:28px">${o.host}</b></div>
      </div>` },
  ];
  if (o.single) {
    slides.push({ type: "raw", theme: o.theme, html: `
      <div class="mono kick">Desktop and mobile</div>
      <h2>${o.s3}</h2>
      <div style="position:absolute;left:0;right:110px;bottom:40px">${BR(hero, o.host)}</div>
      ${PH(sh("m0"), "position:absolute;right:-10px;bottom:-40px;width:290px;transform:rotate(5deg)")}` });
  } else if (!o.phoneOnly) {
    slides.push({ type: "raw", theme: o.theme, html: `
      <div class="mono kick">Inside the site</div>
      <h2>${o.s3}</h2>
      <div style="position:absolute;left:-20px;width:700px;bottom:300px;transform:rotate(-1.5deg)">${BR(sh(o.d1 || "d1"), o.host)}</div>
      <div style="position:absolute;right:-30px;width:700px;bottom:30px;transform:rotate(1.5deg)">${BR(sh(o.d2 || "d2"), o.host)}</div>` });
  }
  slides.push({ type: "raw", theme: o.theme3 || "cream", html: `
      <div class="mono kick">On the phone</div>
      <h2>${o.s4}</h2>
      <div style="position:absolute;left:0;right:0;bottom:-30px;display:flex;justify-content:center;gap:48px">
        ${PH(sh(o.m0 || "m0"), "transform:rotate(-3deg)")}${PH(sh(o.m1 || "m1"), "transform:rotate(3deg) translateY(70px)")}</div>` });
  const poses = ["09", "02", "07", "13", "06", "01"];
  slides.push(cta(o.ctaTheme || "sunset", undefined, poses[(folio.n = (folio.n || 0) + 1) % poses.length]));
  return { id: "work-" + o.id, group: "Portfolio", label: "Portfolio", theme: o.theme, slides };
}

const work = [
  folio({ id: "gampi", name: "Gampi Casa Criativa", nameHtml: "Gampi<br><em>Casa Criativa</em>", tag: "Concept", theme: "brown", host: "gampi-site.vercel.app", type: "Concept site", field: "Advertising agency", status: "Concept",
    briefKick: "The concept", headline: "What could this agency <em>look like online?</em>",
    text: "A concept we created for Gampi, an advertising and design agency: a bold, story-led site that shows the agency what its own brand could look like online.",
    badge: ["Concept", "for Gampi"], s3: "Big type. <em>Bold color.</em> Stories first.", s4: "Just as loud <em>on mobile.</em>", ctaTheme: "sunset" }),
  folio({ id: "wottrich", name: "Wottrich Advocacia", nameHtml: "Wottrich<br><em>Advocacia</em>", tag: "Legal", theme: "sky", host: "wottrichadvocacia.com.br", type: "Institutional site", field: "Law practice",
    headline: "Serious work, <em>clear site.</em>", text: "A sober site for a law practice in Ivoti, with its practice areas and direct links to follow a case in court.",
    s3: "Practice areas, <em>one scroll away.</em>", s4: "Sober on <em>every screen.</em>", m0: "m1", m1: "m1" }),
  folio({ id: "simplifique", name: "Simplifique Capital", nameHtml: "Simplifique<br><em>Capital</em>", tag: "Finance", theme: "sky", host: "simplifiquecapital.com.br", type: "Institutional site", field: "Financial advice",
    headline: "Money talk, <em>made simple.</em>", text: "A clear site for a financial advisor who teaches clients to run a simple, low-cost portfolio.",
    s3: "Clear steps, <em>calm design.</em>", s4: "Simple on <em>a small screen.</em>", d2: "d3" }),
  folio({ id: "fabiana", name: "Fabiana Campos", nameHtml: "Fabiana<br><em>Campos</em>", tag: "Psychology", theme: "butter", host: "fabianacampos.com.br", type: "Portfolio site", field: "Psychology",
    headline: "Warm, <em>personal, plain.</em>", text: "A warm personal site for a psychologist, with therapy and assessment explained in plain words.",
    s3: "Plain words, <em>warm tones.</em>", s4: "Gentle on <em>small screens.</em>" }),
  folio({ id: "geraldo", name: "Geraldo Búrigo", nameHtml: "Geraldo<br><em>Búrigo</em>", tag: "Finance", theme: "sunset", host: "geraldoburigo.com", type: "Institutional site", field: "Investment advice", hero: "shots/geraldo-hero.webp",
    headline: "An editorial site <em>for an advisor.</em>", text: "An editorial site for an independent investment advisor, built around a clear path to the first meeting.",
    s3: "Editorial layout, <em>one clear path.</em>", s4: "The same calm <em>on mobile.</em>", d1: "d2", d2: "d3", m0: "m1", m1: "m1" }),
  folio({ id: "bruna", name: "Bruna Fagundes", nameHtml: "Bruna<br><em>Fagundes</em>", tag: "Event", theme: "sky", host: "brunafagundes.com.br", type: "Invitation site", field: "Graduation party",
    headline: "An invitation <em>you can scroll.</em>", text: "A hand-illustrated invitation site for a law graduation, with RSVP and gift list in one place.",
    s3: "Hand-drawn, <em>start to finish.</em>", s4: "RSVP from <em>the phone.</em>" }),
  folio({ id: "eduardo", name: "Eduardo Kayser", nameHtml: "Eduardo<br><em>Kayser</em>", tag: "Consulting", theme: "sky", host: "eduardokayser.com.br", type: "Institutional site", field: "Management consulting",
    headline: "Two audiences, <em>one site.</em>", text: "A site for a management consulting ecosystem, with separate paths for companies and for professionals.",
    s3: "Clear paths <em>for each visitor.</em>", s4: "Built to read <em>on the go.</em>", d2: "d3" }),
  folio({ id: "envvi", name: "Envvi", titleSize: 220, tag: "Sustainability", theme: "butter", host: "envvi.com.br", type: "Institutional site", field: "Environmental consulting",
    headline: "A long list, <em>made easy.</em>", text: "A technical site for an environmental consultancy that organises a long list of climate and risk services.",
    s3: "Technical, <em>but easy to scan.</em>", s4: "Organised <em>on mobile too.</em>" }),
  folio({ id: "fernando", name: "Fernando Kayser", nameHtml: "Fernando<br><em>Kayser</em>", tag: "Insurance", theme: "sunset", host: "fernandokayser.com.br", type: "Institutional site", field: "Life insurance",
    headline: "Built around <em>the family.</em>", text: "A warm site for a life insurance and estate planning advisor, built around protecting the family.",
    s3: "Warm tones, <em>clear services.</em>", s4: "Protection, <em>one tap away.</em>" }),
  folio({ id: "lorena", name: "Brunch de Fraldas da Lorena", nameHtml: "Brunch de Fraldas<br><em>da Lorena</em>", titleSize: 116, tag: "Baby shower", theme: "butter", host: "convitelorena.vercel.app", type: "Invitation site", field: "Baby shower", single: true,
    headline: "A save-the-date <em>with a story.</em>", text: "An illustrated save-the-date for a baby shower held in two cities, with the details of each event.",
    s3: "Illustrated, <em>top to bottom.</em>", s4: "Made to be <em>shared by text.</em>" }),
  folio({ id: "geraldolinks", name: "Geraldo Búrigo, links", nameHtml: "Geraldo Búrigo<br><em>links</em>", titleSize: 120, tag: "Link page", kicker: "Link pages", theme: "cream", theme2: "sunset", host: "geraldoburigo.com/links", type: "Link page", field: "Investment advice", coverPhone: true, phoneOnly: true,
    headline: "One link, <em>every next step.</em>", text: "A link page for social bios that sends followers to the consultancy, the e-book and the community.",
    s4: "Your brand, <em>not a template.</em>", m1: "m0" }),
  folio({ id: "simplifiquelinks", name: "Simplifique Capital, links", nameHtml: "Simplifique<br><em>links</em>", tag: "Link page", kicker: "Link pages", theme: "sky", host: "simplifiquecapital.com.br/links", type: "Link page", field: "Financial advice", coverPhone: true, phoneOnly: true,
    headline: "Everything, <em>one tap away.</em>", text: "A link page that puts WhatsApp, the site and e-mail one tap away.",
    s4: "Matches the <em>main site.</em>", m1: "m0" }),
];

// ---------- Brand ----------
const brand = [
  { id: "brand-meet", group: "Brand", label: "Meet LoWa", theme: "sunset", slides: [
    { type: "raw", html: `<div class="mono kick">Hello, agencies</div><h1 style="font-size:190px">We built.<br><em>You sell.</em></h1>
      <p class="body" style="margin-top:36px;max-width:560px">LoWa Studio is a production team behind US agencies that resell AI-built websites.</p>
      ${Wimg("02", "width:520px;right:-40px;bottom:-30px")}${stamp("left:60px;bottom:40px")}` },
    { type: "text", theme: "cream", kick: "What we are", title: "Your build team, <em>behind the scenes.</em>",
      body: "Agencies sell the website. We design and build it, fast, at a fixed price. <b>You keep the client relationship.</b>",
      media: Wimg("13", "width:430px;right:-20px;bottom:-30px") },
    { type: "text", theme: "brown", kick: "How we work", title: "AI-built websites <em>with no AI look.</em>",
      body: "We build with AI tools, directed by a senior designer and a project manager who knows web businesses. Fast, beautiful pages that are ready to convert.",
      media: Wimg("09", "width:420px;right:-20px;bottom:-30px") },
    { type: "list", theme: "cream", kick: "What you get", title: "Why agencies <em>choose us.</em>", ts: 92, items: [
      ["Fast delivery", "From brief to a live site in 24 hours."],
      ["Fixed prices", "Starting at $920. No hourly surprises."],
      ["One team", "A senior designer and a project manager on every site."],
      ["You keep the client", "We stay on the project until it goes live."]] },
    cta("sunset", "Ready to sell <em>websites?</em>", "07"),
  ]},
  { id: "brand-name", group: "Brand", label: "The name", theme: "butter", slides: [
    { type: "raw", html: `<div class="mono kick">The name</div><h1 style="font-size:220px">Why<br><em>LoWa?</em></h1>
      <p class="body" style="margin-top:30px;max-width:400px">Every studio has a story. Here's ours.</p>
      ${Wimg("01", "width:470px;right:-50px;bottom:-40px")}` },
    { type: "raw", theme: "cream", html: `<div class="mono kick">The story</div><h2>Where the name <em>comes from.</em></h2>
      ${big("Lo")}<div class="pending" style="margin-top:56px;position:relative;z-index:2;background-color:var(--cream)">[The story behind the name LoWa, in 2 or 3 short lines. Pending from Sarah.]</div>` },
    { type: "raw", theme: "sky", html: `<div class="mono kick">Meet Walter</div><h2>The face <em>of the studio.</em></h2>
      <div class="pending" style="margin-top:56px;max-width:600px">[Who Walter is and why he is part of the brand. Pending from Sarah.]</div>
      ${Wimg("07", "width:520px;right:-40px;bottom:-40px")}` },
    cta("sunset", "Now you know us. <em>Let's build.</em>", "06"),
  ]},
  { id: "brand-pricing", group: "Brand", label: "Pricing", theme: "cream", slides: [
    { type: "raw", theme: "brown", html: `<div class="mono kick">Pricing</div><h1 style="font-size:180px">Fixed prices.<br><em>No surprises.</em></h1>
      <p class="body" style="margin-top:36px;max-width:620px">Three ways to work with LoWa Studio. Swipe to see what's inside each one.</p>
      ${Wimg("09", "width:440px;right:-20px;bottom:-30px")}` },
    { type: "raw", html: `<div class="mono kick">01 · Small website</div>
      <div class="card" style="margin-top:10px">
        <div class="price">$920<small>one time</small></div>
        <h2 style="font-size:64px;margin-top:28px">Home, About <em>and</em> Contact</h2>
        <ul class="ticks"><li>Three pages, built to sell</li><li>CMS panel included, so your client edits their own content</li><li>Mobile and PageSpeed-first build</li><li>Live in 24 hours</li></ul></div>${Wimg("13", "width:300px;right:-10px;bottom:-30px")}` },
    { type: "raw", theme: "sunset", html: `<div class="mono kick">02 · Bigger websites</div>
      <div class="card" style="margin-top:10px">
        <div class="price">$1,200<small>from 4 pages</small></div>
        <h2 style="font-size:64px;margin-top:28px">$250 for each <em>extra page</em></h2>
        <ul class="ticks"><li>Starting at 4 pages</li><li>CMS panel included</li><li>Fixed scope, agreed before the build</li></ul></div>${Wimg("06", "width:420px;right:-20px;bottom:-30px")}` },
    { type: "raw", theme: "sky", html: `<div class="mono kick">03 · Monthly maintenance</div>
      <div class="card" style="margin-top:10px">
        <div class="price">$180<small>per month</small></div>
        <h2 style="font-size:64px;margin-top:28px">So the site <em>stays fast.</em></h2>
        <ul class="ticks"><li>Hosting, updates and backups</li><li>Small edits</li><li>CMS editing is already in the build, so maintenance covers the care</li></ul></div>${Wimg("11", "width:400px;right:-10px;bottom:-30px")}` },
    { type: "list", theme: "butter", kick: "In every build", title: "What's <em>inside.</em>", ts: 100, items: [
      ["Design and build", "Layout, colour and type made for the client's market."],
      ["Copy structure", "Page outline and headlines that say what the client sells."],
      ["CMS panel", "Text, images and new pages edited without touching code."],
      ["Performance and SEO", "Fast pages, clean markup and the basics search needs."],
      ["Forms, tracking, launch", "Tested before launch, with a short handoff for your client."]] },
    cta("brown", "Pick a size. <em>We'll build it.</em>", "02"),
  ]},
  { id: "brand-agencies", group: "Brand", label: "Who it's for", theme: "sky", slides: [
    { type: "raw", html: `<div class="mono kick">Who we work with</div><h1 style="font-size:200px">Built for<br><em>agencies.</em></h1>
      <p class="body" style="margin-top:36px;max-width:600px">Small US agencies that sell websites to their clients and want a reliable team to build them.</p>
      ${Wimg("13", "width:480px;right:-30px;bottom:-30px")}` },
    { type: "list", theme: "cream", kick: "Sound familiar?", title: "A client needs a site. <em>Now what?</em>", ts: 90, items: [
      ["The client needs it fast", ""], ["Your team is busy with everything else", ""], ["Freelancers are hard to manage", ""], ["Hourly quotes scare clients off", ""]] },
    { type: "text", theme: "brown", kick: "The model", title: "You sell. <em>We build.</em>",
      body: "You bring the client and keep the relationship. We take the brief, then design, build and launch the site. <b>Fixed price, every time.</b>",
      media: Wimg("06", "width:470px;right:-30px;bottom:-20px") },
    { type: "list", theme: "butter", kick: "What your clients get", title: "Sites that <em>do the work.</em>", ts: 96, items: [
      ["Fast pages", "Mobile and PageSpeed-first build."], ["Their own CMS panel", "They edit text and images without calling you."],
      ["Copy that sells", "Headlines that say what the business does."], ["Tested before launch", "Forms, tracking and domain checked."]] },
    cta("sunset", "Your agency, <em>our build team.</em>", "09"),
  ]},
  { id: "brand-process", group: "Brand", label: "Process", theme: "sunset", slides: [
    { type: "raw", html: `<div class="mono kick">Process</div><h1 style="font-size:170px">From brief<br>to live, <em>in 24 hours.</em></h1>
      ${Wimg("06", "width:560px;right:-40px;bottom:-20px")}${stamp("left:40px;bottom:60px")}` },
    ...[["0 h", "Brief", "A short form tells us the goal, the audience and the deadline.", "cream"],
        ["2 h", "Structure", "We send the page outline, timeline and fixed price.", "sky"],
        ["8 h", "Design", "Layout and copy come together, reviewed by a senior designer.", "butter"],
        ["16 h", "Build and check", "Pages built, forms tested, speed and SEO checked.", "cream"],
        ["24 h", "Live", "Site on the domain, with a short handoff for your client.", "brown"]].map(([h, t, b, th], i) => ({
      type: "raw", theme: th, html: `<div class="mono kick">Step ${i + 1} of 5</div>
        <div style="font-family:'Instrument Serif',serif;font-size:330px;line-height:.8;letter-spacing:-.04em;margin-top:40px">${h.replace(" h", "<em style='font-style:italic;font-size:.5em'>h</em>")}</div>
        <h2 style="margin-top:60px">${t}</h2><p class="body" style="margin-top:28px;max-width:760px">${b}</p>
        <div style="margin-top:auto;display:grid;grid-template-columns:repeat(5,1fr);gap:12px">${[0,1,2,3,4].map(k => `<span style="height:12px;border-radius:6px;background:currentColor;opacity:${k <= i ? 1 : .2}"></span>`).join("")}</div>` })),
    cta("sunset", "Brief today. <em>Live tomorrow.</em>", "02"),
  ]},
];

// ---------- Websites in general ----------
const wire = (n) => `<div class="wire"><div class="bar"><i></i><i></i><i></i></div><div class="in">
  <div style="display:flex;justify-content:space-between;align-items:center"><div class="blk" style="width:140px;height:26px"></div><div style="display:flex;gap:16px"><div class="blk" style="width:70px;height:16px"></div><div class="blk" style="width:70px;height:16px"></div><div class="blk" style="width:110px;height:38px;border-radius:20px;background:var(--blue)"></div></div></div>
  <div style="margin-top:56px;font-family:'Instrument Serif',serif;font-size:76px;line-height:.95;color:var(--ink)">We fix leaks<br><em>in one visit.</em></div>
  <div class="blk" style="width:70%;height:18px;margin-top:26px"></div><div class="blk" style="width:55%;height:18px;margin-top:12px"></div>
  <div style="margin-top:34px;width:260px;height:64px;border-radius:40px;background:var(--blue)"></div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:44px"><div class="blk" style="height:120px"></div><div class="blk" style="height:120px"></div><div class="blk" style="height:120px"></div></div>
  <div class="blk" style="margin-top:22px;height:70px;background:var(--butter)"></div></div></div>`;
const call = (num, css) => `<div class="callout" style="${css}"><span class="num">${num}</span></div>`;

const web = [
  { id: "web-2027", group: "Websites", label: "Websites 101", theme: "cream", slides: [
    { type: "raw", html: `<div class="mono kick">Websites 101</div><h1 style="font-size:170px">Still need a <em>website</em> in 2027?</h1>
      <p class="body" style="margin-top:36px;max-width:560px">Short answer: yes. Swipe for the long one.</p>${Wimg("04", "width:560px;right:-40px;bottom:-30px")}` },
    { type: "text", media: big("01"), theme: "brown", kick: "01", title: "Social is rented. <em>Your site is owned.</em>", body: "Platforms change their rules and their reach. Your website is the one place online where you set the rules." },
    { type: "text", media: big("02"), theme: "sky", kick: "02", title: "People look you up <em>before they call.</em>", body: "A referral, an ad, a post: the next step is often a search for your name. Your site is what they find." },
    { type: "text", theme: "butter", kick: "03", title: "It works <em>while you sleep.</em>", body: "It answers questions, shows your work and takes inquiries at 2 a.m.", media: Wimg("11", "width:520px;right:-20px;bottom:-30px") },
    { type: "text", media: big("04"), theme: "sunset", kick: "04", title: "First impressions <em>happen online.</em>", body: "A slow or dated site makes a business look the same. A clear one builds trust before the first call." },
    cta("cream", "Agencies: <em>have this talk with clients.</em>", "13"),
  ]},
  { id: "web-fresh", group: "Websites", label: "Checklist", theme: "butter", slides: [
    { type: "raw", html: `<div class="mono kick">New year, new site</div><h1 style="font-size:230px">2027<br>starts <em>fresh.</em></h1>
      <p class="body" style="margin-top:36px;max-width:560px">A 6-point checklist for a website that's ready for the new year.</p>${Wimg("13", "width:500px;right:-30px;bottom:-30px")}` },
    { type: "list", theme: "cream", kick: "Checklist · 1 to 3", title: "The <em>basics.</em>", items: [
      ["Say what you sell, in one line", "Visitors decide fast. Your headline should too."],
      ["Design for the thumb", "Plenty of visits start on a phone. Plan for it first."],
      ["Fast to load", "Slow pages lose people before they read a word."]], media: Wimg("06", "width:420px;right:-20px;bottom:-30px") },
    { type: "list", theme: "sky", kick: "Checklist · 4 to 6", title: "The <em>details.</em>", items: [
      ["One clear next step", "Book, call or buy: pick one and make it obvious."],
      ["Real photos, real words", "Stock images and vague copy feel like nobody's home."],
      ["Easy to update", "If changing a price needs a developer, it won't happen."]], media: Wimg("07", "width:400px;right:-20px;bottom:-30px") },
    cta("brown", "Fresh site for 2027? <em>We build it.</em>", "09"),
  ]},
  { id: "web-signs", group: "Websites", label: "Redo signs", theme: "brown", slides: [
    { type: "raw", html: `<div class="mono kick">Quick check</div><h1 style="font-size:170px">5 signs it's time for a <em>new site.</em></h1>${Wimg("04", "width:520px;right:-30px;bottom:-30px")}` },
    { type: "list", theme: "cream", kick: "Signs 1 to 3", title: "Does this <em>ring a bell?</em>", items: [
      ["It's slow on a phone", "If it lags for you, it lags for every visitor."],
      ["It looks like another decade", "Design ages. Visitors notice."],
      ["Nobody can edit it", "Old prices, old photos, old team."]], media: Wimg("04", "width:430px;right:-20px;bottom:-30px") },
    { type: "list", theme: "sunset", kick: "Signs 4 and 5", title: "And <em>these two.</em>", items: [
      ["There's no clear next step", "Visitors read, then leave without calling."],
      ["It doesn't show what you do today", "The business changed. The site didn't."]], media: Wimg("11", "width:460px;right:-20px;bottom:-30px") },
    cta("sky", "Two or more? <em>Time for a new one.</em>", "02"),
  ]},
  { id: "web-anatomy", group: "Websites", label: "Anatomy", theme: "sky", slides: [
    { type: "raw", html: `<div class="mono kick">Anatomy</div><h1 style="font-size:112px">A homepage<br><em>that converts.</em></h1>
      <div style="position:absolute;left:30px;right:30px;top:330px;transform:rotate(-1deg)">${wire()}</div>
      ${call("01", "left:10px;top:500px")}${call("02", "left:340px;top:700px")}${call("03", "right:10px;top:800px")}${call("04", "right:10px;top:960px")}` },
    { type: "list", theme: "cream", kick: "Above the fold", title: "First <em>two seconds.</em>", items: [
      ["A headline that says what you sell", "Not a slogan. What you do, for whom."],
      ["One clear call to action", "One button, one verb: book, call, buy."]], media: big("01") },
    { type: "list", theme: "butter", kick: "Below the fold", title: "Then, <em>trust.</em>", items: [
      ["Proof", "Real work, real reviews, real numbers. Never invented ones."],
      ["Easy contact", "A form, a phone number or WhatsApp, one tap away."]], media: Wimg("07", "width:440px;right:-20px;bottom:-30px") },
    cta("brown", "We build every site <em>this way.</em>", "13"),
  ]},
];

const POSTS = [...brand, ...work, ...web];
// Suggested feed order: mixes brand, work and websites.
const ORDER = ["brand-meet", "work-gampi", "web-2027", "brand-agencies", "work-wottrich", "web-fresh", "brand-pricing", "work-bruna",
  "web-anatomy", "brand-process", "work-fabiana", "web-signs", "work-geraldo", "work-eduardo", "brand-name", "work-lorena",
  "work-envvi", "work-fernando", "work-simplifique", "work-geraldolinks", "work-simplifiquelinks"];
if (typeof module !== "undefined") module.exports = { POSTS, ORDER };
