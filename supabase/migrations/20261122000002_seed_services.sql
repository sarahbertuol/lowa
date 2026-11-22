-- Service catalog seed (OE-01). Values from the LoWa Studio site (/services), 20/11/2026.
-- Sarah edits these in /discover/catalog. Null payment_terms and delivery are pending
-- (docs/PENDENCIAS.md): proposals show them as "[to confirm]" until filled in.

insert into services (slug, name, category, price_type, price_cents, extra_page_cents, included_pages, summary, inclusions, exclusions, delivery, notes, active, sort_order) values
(
  'small-website', 'Small business website', 'website', 'fixed', 92000, null, 3,
  'Three pages that present the business and take inquiries.',
  array['Three pages: Home, About, Contact', 'CMS panel to edit your content', 'Mobile-first design', 'Performance and basic SEO', 'Forms and tracking', 'Launch'],
  array['Online store and payments'],
  null,
  'Never offer as an e-commerce solution. Site promise "live in 24 hours" pending confirmation.',
  true, 10
),
(
  'bigger-website', 'Bigger website', 'website', 'from', 120000, 25000, 4,
  'Four or more pages, scope agreed before production.',
  array['Four pages to start', 'CMS panel to edit your content', 'Mobile-first design', 'Performance and basic SEO', 'Forms and tracking', 'Launch'],
  array['Online store and payments'],
  null,
  'Additional pages US$250 each. Final scope agreed before production.',
  true, 20
),
(
  'maintenance', 'Monthly maintenance', 'care', 'monthly', 18000, null, null,
  'Hosting, updates, backups and small edits.',
  array['Hosting', 'Updates', 'Backups', 'Small edits according to published terms'],
  array[]::text[],
  null, null,
  true, 30
),
(
  'ecommerce', 'E-commerce', 'website', 'custom', null, null, null,
  'An online store scoped to your products and payments.',
  array[]::text[], array[]::text[],
  null, 'Custom quote. Never present the US$920 package as e-commerce.',
  true, 40
),
(
  'landing-page', 'Landing page', 'website', 'fixed', null, null, 1,
  'One focused page for a campaign, season or launch.',
  array[]::text[], array[]::text[],
  null, 'Price and scope pending from Sarah. Inactive until set.',
  false, 50
),
(
  'growth', 'Digital presence and growth', 'growth', 'custom', null, null, null,
  'Projects to improve discovery, conversion and retention.',
  array[]::text[], array[]::text[],
  null, 'Custom quote.',
  true, 60
),
(
  'agency-partnership', 'Agency partnership', 'agency', 'custom', null, null, null,
  'White-label website production and Webflow project management for agencies.',
  array[]::text[], array[]::text[],
  null, 'Custom quote. Offer details pending from Sarah.',
  true, 70
);
