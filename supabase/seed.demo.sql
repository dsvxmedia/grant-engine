-- =============================================================================
-- Grant Engine — Demo Seed Data
-- =============================================================================
-- Run this against a dedicated demo Supabase project (NOT production).
-- All data is fictional and for demonstration purposes only.
--
-- Usage:
--   psql $DATABASE_URL -f supabase/seed.demo.sql
--   (or paste into Supabase SQL editor)
-- =============================================================================

-- ─── BUSINESS ENTITIES (2) ───────────────────────────────────────────────────

INSERT INTO business_entities (
  id, name, type, industry, naics_codes, founding_date,
  state, city, revenue_range, employee_count,
  mission, focus_area,
  is_african_american_owned, is_minority_owned, is_tech_company,
  is_social_enterprise, is_community_serving,
  sam_registered, sbir_eligible,
  matching_active, owner_demographics, pitch_angles_generated
) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'The Clear State',
  'llc',
  'Legal Technology',
  ARRAY['541511', '541519'],
  '2021-01-15',
  'CA', 'Los Angeles',
  'under_50k', 1,
  'Democratizing legal clarity for small business owners through AI-powered tools that simplify compliance, contracts, and operational workflows.',
  'AI legal tech, plain-language contracts, small business compliance, access to justice',
  true, true, true, true, true,
  false, false,
  true,
  '{"founder_gender":"male","founder_race":"Black/African American","founder_age_range":"30-39"}'::jsonb,
  '[
    {"angle":"Black-led AI legal tech closing the justice access gap for micro-businesses","strength":"high"},
    {"angle":"First plain-English contract AI purpose-built for solopreneurs","strength":"high"},
    {"angle":"Los Angeles community anchor serving underserved entrepreneurs","strength":"medium"},
    {"angle":"Scalable legal compliance platform with demonstrated early traction","strength":"medium"}
  ]'::jsonb
),
(
  '00000000-0000-0000-0000-000000000002',
  'FlowTech Ventures',
  'llc',
  'Revenue Operations Software',
  ARRAY['511210'],
  '2022-06-01',
  'CA', 'Los Angeles',
  'under_250k', 2,
  'Helping service businesses convert leads to revenue faster through AI-powered CRM and proposal automation.',
  'Revenue operations, CRM automation, proposal software, sales enablement for SMBs',
  false, true, true, false, false,
  false, false,
  true,
  '{"founder_gender":"male","founder_race":"Hispanic/Latino","founder_age_range":"25-34"}'::jsonb,
  '[
    {"angle":"AI-native CRM purpose-built for service businesses","strength":"high"},
    {"angle":"Minority-led SaaS closing the revenue execution gap for SMBs","strength":"medium"}
  ]'::jsonb
);

-- ─── GRANTS (20 total) ───────────────────────────────────────────────────────

INSERT INTO grants (
  id, source, source_url, application_url,
  title, description, funder_name, funder_type,
  award_min, award_max, deadline,
  eligibility_text, eligibility_tags, category_tags,
  geographic_restrictions, requires_loi,
  content_hash, status
) VALUES

-- FEDERAL (5)
(
  '00000000-0000-0000-0001-000000000001',
  'grants-gov',
  'https://www.grants.gov/demo/eda-build-to-scale',
  'https://www.grants.gov/demo/eda-build-to-scale',
  'EDA Build to Scale: Venture Challenge',
  'The U.S. Economic Development Administration''s Build to Scale program funds organizations that support entrepreneurial ecosystems, with emphasis on inclusive innovation and tech-enabled startups. The Venture Challenge track supports early-stage companies with scalable business models addressing market gaps in underserved communities.',
  'Economic Development Administration (EDA)',
  'federal',
  50000, 500000,
  '2026-09-15 17:00:00+00',
  'U.S.-based organization or business. 2+ years operating history preferred. Technology-enabled product or service with demonstrable market traction. Inclusive innovation focus preferred.',
  ARRAY['us-based', 'tech-enabled', 'for-profit', 'startup'],
  ARRAY['economic-development', 'tech-innovation', 'entrepreneurship'],
  '{"national": true}'::jsonb,
  false,
  'demo_g01_eda_build_scale_2026',
  'active'
),
(
  '00000000-0000-0000-0001-000000000002',
  'sbir',
  'https://www.sbir.gov/demo/nsf-ai-compliance',
  'https://www.sbir.gov/demo/nsf-ai-compliance',
  'SBIR Phase I: AI-Powered Tools for Small Business Compliance',
  'NSF Small Business Innovation Research Phase I award supporting development of artificial intelligence tools that reduce regulatory and legal compliance burden for small businesses. Seeks novel AI applications with a clear commercialization pathway and evidence of technical feasibility.',
  'National Science Foundation (NSF)',
  'federal',
  150000, 275000,
  '2026-08-15 17:00:00+00',
  'U.S. small business under 500 employees, for-profit, majority U.S.-owned. Principal Investigator must be primarily employed by the small business at time of award.',
  ARRAY['us-based', 'small-business', 'for-profit', 'sbir-eligible', 'tech-company'],
  ARRAY['ai-technology', 'small-business-support', 'innovation-research'],
  '{"national": true}'::jsonb,
  false,
  'demo_g02_sbir_ai_compliance_2026',
  'active'
),
(
  '00000000-0000-0000-0001-000000000003',
  'grants-gov',
  'https://www.grants.gov/demo/mbda-capacity',
  'https://www.grants.gov/demo/mbda-capacity',
  'MBDA Business Center: Capacity Building & Growth Initiative',
  'The Minority Business Development Agency funds capacity-building programs for minority-owned firms. Awards support operational infrastructure investment, technology adoption, market expansion, and workforce development for minority entrepreneurs demonstrating growth trajectory.',
  'Minority Business Development Agency (MBDA)',
  'federal',
  25000, 100000,
  '2026-08-15 17:00:00+00',
  'Minority-owned U.S. business with 1+ year operating history. Must submit a demonstrable capacity-building plan with measurable outcomes and timeline.',
  ARRAY['minority-owned', 'us-based', 'for-profit'],
  ARRAY['minority-business', 'capacity-building', 'economic-empowerment'],
  '{"national": true}'::jsonb,
  false,
  'demo_g03_mbda_capacity_2026',
  'active'
),
(
  '00000000-0000-0000-0001-000000000004',
  'federal-register',
  'https://www.federalregister.gov/demo/sba-sttr',
  'https://www.federalregister.gov/demo/sba-sttr',
  'SBA Small Business Technology Transfer (STTR) Program',
  'The Small Business Technology Transfer program requires collaboration between small businesses and U.S. research institutions. Funds early-stage R&D with a focus on technology that addresses federal agency mission needs and has clear commercial applications.',
  'Small Business Administration (SBA)',
  'federal',
  50000, 175000,
  '2026-10-01 17:00:00+00',
  'U.S. small business under 500 employees. Must have formal collaboration agreement with U.S. research institution. For-profit, majority U.S.-owned. PI must be employee or owner.',
  ARRAY['us-based', 'small-business', 'sbir-eligible', 'for-profit', 'tech-company'],
  ARRAY['r-and-d', 'tech-transfer', 'innovation'],
  '{"national": true}'::jsonb,
  false,
  'demo_g04_sba_sttr_2026',
  'active'
),
(
  '00000000-0000-0000-0001-000000000005',
  'federal-register',
  'https://www.federalregister.gov/demo/doj-access-justice',
  'https://www.federalregister.gov/demo/doj-access-justice',
  'DOJ Access to Justice: Technology Innovation Grant',
  'Department of Justice initiative funding technology solutions that improve access to legal aid, court navigation, and rights information for underserved communities. Emphasis on AI-powered tools that reduce legal complexity and eliminate language and literacy barriers.',
  'U.S. Department of Justice (DOJ)',
  'federal',
  75000, 300000,
  '2026-11-30 17:00:00+00',
  'U.S. nonprofit or for-profit with demonstrated or projected impact on access to legal services for underserved populations. Technology must be the primary delivery mechanism.',
  ARRAY['us-based', 'tech-enabled', 'community-serving', 'social-enterprise'],
  ARRAY['legal-tech', 'access-to-justice', 'community-impact'],
  '{"national": true}'::jsonb,
  true,
  'demo_g05_doj_access_justice_2026',
  'active'
),

-- STATE (4)
(
  '00000000-0000-0000-0001-000000000006',
  'states',
  'https://casbdc.org/demo/capacity-tech',
  'https://casbdc.org/demo/capacity-tech',
  'California SBDC: Small Business Capacity & Technology Grant',
  'The California Small Business Development Center Network awards capacity-building grants to California-based small businesses investing in technology adoption, workforce training, or operational infrastructure improvements that create jobs or improve competitiveness.',
  'California SBDC Network',
  'state',
  5000, 25000,
  '2026-07-20 17:00:00+00',
  'California-based small business under 100 employees, in operation at least 6 months. Must demonstrate a specific technology or capacity need with a plan for implementation.',
  ARRAY['california', 'small-business', 'us-based'],
  ARRAY['capacity-building', 'technology-adoption', 'small-business'],
  '{"states": ["CA"]}'::jsonb,
  false,
  'demo_g06_ca_sbdc_tech_2026',
  'active'
),
(
  '00000000-0000-0000-0001-000000000007',
  'states',
  'https://losangeles.gov/economic-development/demo/innovation-grant',
  'https://losangeles.gov/economic-development/demo/innovation-grant',
  'City of Los Angeles: Economic Innovation & Small Business Grant',
  'The Los Angeles Office of Economic Development funds innovation-focused small businesses contributing to local job creation and economic growth. Priority given to businesses in historically underinvested communities and to founders from underrepresented backgrounds.',
  'City of Los Angeles — Office of Economic Development',
  'state',
  10000, 50000,
  '2026-07-10 17:00:00+00',
  'Los Angeles-based business (within city limits), 1+ year operating, under 50 employees. Priority for businesses in low-to-moderate income census tracts or owned by underrepresented founders.',
  ARRAY['los-angeles', 'california', 'minority-owned', 'small-business', 'community-serving'],
  ARRAY['economic-development', 'local-business', 'innovation'],
  '{"cities": ["Los Angeles"]}'::jsonb,
  false,
  'demo_g07_la_economic_innovation_2026',
  'active'
),
(
  '00000000-0000-0000-0001-000000000008',
  'states',
  'https://calosb.ca.gov/demo/equity-grant',
  'https://calosb.ca.gov/demo/equity-grant',
  'CalOSBA: Equity-Focused Small Business Grant',
  'The California Governor''s Office of Business and Economic Development awards grants to small businesses owned by underrepresented entrepreneurs, supporting growth-stage companies investing in digital infrastructure, talent, and market expansion.',
  'California Office of the Small Business Advocate (CalOSBA)',
  'state',
  10000, 30000,
  '2026-08-01 17:00:00+00',
  'California-based small business, minority-owned or women-owned, under 25 employees, under $1M annual revenue.',
  ARRAY['california', 'minority-owned', 'women-owned', 'small-business'],
  ARRAY['equity-business', 'digital-infrastructure', 'entrepreneurship'],
  '{"states": ["CA"]}'::jsonb,
  false,
  'demo_g08_calosba_equity_2026',
  'active'
),
(
  '00000000-0000-0000-0001-000000000009',
  'states',
  'https://laincubator.org/demo/innovation-grant',
  'https://laincubator.org/demo/innovation-grant',
  'LACI Innovation Grant: Digital Equity & Community Tech',
  'The Los Angeles Cleantech Incubator funds entrepreneurs working at the intersection of technology and community benefit. The 2026 cycle focuses on digital equity, AI accessibility, and software solutions that reduce systemic barriers for underserved populations.',
  'Los Angeles Cleantech Incubator (LACI)',
  'state',
  15000, 75000,
  '2026-09-30 17:00:00+00',
  'LA-based startup under 5 years old, tech-enabled, working in digital equity, AI accessibility, or community-benefit technology. Must demonstrate or articulate clear community impact.',
  ARRAY['los-angeles', 'tech-company', 'community-serving', 'startup'],
  ARRAY['digital-equity', 'community-tech', 'ai-accessibility'],
  '{"cities": ["Los Angeles"], "regions": ["Southern California"]}'::jsonb,
  false,
  'demo_g09_laci_innovation_2026',
  'active'
),

-- CORPORATE (5)
(
  '00000000-0000-0000-0001-000000000010',
  'corporate',
  'https://startup.google.com/programs/black-founders/demo',
  'https://startup.google.com/programs/black-founders/demo',
  'Google for Startups: Black Founders Fund',
  'Google for Startups Black Founders Fund provides non-dilutive cash awards plus up to $100K in Google Cloud credits to Black-founded U.S. startups. Priority given to AI-enabled companies with demonstrated product traction and a scalable business model.',
  'Google LLC',
  'corporate',
  50000, 100000,
  '2026-07-15 17:00:00+00',
  'U.S.-based startup, majority Black-founded, early stage (seed to Series A), technology-enabled product with some user or revenue evidence.',
  ARRAY['african-american-owned', 'us-based', 'tech-company', 'startup'],
  ARRAY['black-founders', 'tech-startup', 'ai-enabled'],
  '{"national": true}'::jsonb,
  false,
  'demo_g10_google_black_founders_2026',
  'active'
),
(
  '00000000-0000-0000-0001-000000000011',
  'corporate',
  'https://jpmorganchase.com/advancing-black-pathways/demo',
  'https://jpmorganchase.com/advancing-black-pathways/demo',
  'JPMorgan Chase: Advancing Black Pathways — Entrepreneur Grant',
  'JPMorgan Chase''s Advancing Black Pathways initiative provides grants and technical assistance to Black-owned businesses. Awards support growth-stage companies with strong community ties, at least one year of revenue history, and scalable business models.',
  'JPMorgan Chase & Co.',
  'corporate',
  5000, 50000,
  '2026-07-31 17:00:00+00',
  'Black-owned U.S. business with at least 1 year of revenue history and demonstrable community impact. For-profit, under 50 employees.',
  ARRAY['african-american-owned', 'us-based', 'for-profit'],
  ARRAY['black-business', 'community-impact', 'entrepreneur-support'],
  '{"national": true}'::jsonb,
  false,
  'demo_g11_jpmorgan_black_pathways_2026',
  'active'
),
(
  '00000000-0000-0000-0001-000000000012',
  'corporate',
  'https://amazon.com/smallbusiness/grant/demo',
  'https://amazon.com/smallbusiness/grant/demo',
  'Amazon: Small Business Growth Grant',
  'Amazon''s Small Business Empowerment initiative awards grants to U.S.-based small businesses with innovative products or services. Includes cash award plus $5,000 in Amazon Ads credits. Deadline approaching — apply now.',
  'Amazon Web Services',
  'corporate',
  10000, 25000,
  '2026-06-30 17:00:00+00',
  'U.S. small business under 100 employees, product or service available or launching online.',
  ARRAY['us-based', 'small-business', 'for-profit'],
  ARRAY['small-business', 'digital-growth', 'entrepreneur'],
  '{"national": true}'::jsonb,
  false,
  'demo_g12_amazon_small_biz_2026',
  'active'
),
(
  '00000000-0000-0000-0001-000000000013',
  'corporate',
  'https://visaeverywhere.com/initiative/demo',
  'https://visaeverywhere.com/initiative/demo',
  'Visa Everywhere Initiative: Commerce & Fintech Innovation',
  'The Visa Everywhere Initiative challenges U.S. startups to solve real-world payment, commerce, and financial access problems. Top submissions receive cash awards and potential Visa partnership opportunities. Final submission deadline approaching.',
  'Visa Inc.',
  'corporate',
  10000, 50000,
  '2026-06-28 17:00:00+00',
  'U.S. startup (seed to Series A), fintech or commerce-adjacent product, must address a specific Visa challenge track.',
  ARRAY['us-based', 'tech-company', 'startup'],
  ARRAY['fintech', 'payments', 'commerce-innovation'],
  '{"national": true}'::jsonb,
  false,
  'demo_g13_visa_everywhere_2026',
  'active'
),
(
  '00000000-0000-0000-0001-000000000014',
  'corporate',
  'https://microsoft.com/minority-business-tech/demo',
  'https://microsoft.com/minority-business-tech/demo',
  'Microsoft: Minority-Owned Business Tech Empowerment Grant',
  'Microsoft''s tech empowerment initiative provides grants and cloud credits to minority-owned small businesses investing in digital transformation. Award includes Azure credits, Microsoft 365 licenses, and cash funding for technology workforce development.',
  'Microsoft Corporation',
  'corporate',
  5000, 25000,
  '2026-12-31 17:00:00+00',
  'U.S. minority-owned business under 50 employees, with a demonstrable technology adoption or digital transformation plan.',
  ARRAY['minority-owned', 'us-based', 'small-business', 'tech-enabled'],
  ARRAY['digital-transformation', 'cloud-computing', 'workforce-development'],
  '{"national": true}'::jsonb,
  false,
  'demo_g14_microsoft_minority_tech_2026',
  'active'
),

-- FOUNDATION (4)
(
  '00000000-0000-0000-0001-000000000015',
  'foundations',
  'https://fordfoundation.org/grants/tech-social-justice/demo',
  'https://fordfoundation.org/grants/tech-social-justice/demo',
  'Ford Foundation: Technology for Social Justice Program',
  'The Ford Foundation''s Technology for Social Justice program funds organizations using technology to advance rights, equity, and justice for marginalized communities. 2026 focus areas include AI governance, legal empowerment tools, and civic technology that reduces barriers to institutional participation.',
  'Ford Foundation',
  'foundation',
  50000, 200000,
  '2026-09-01 17:00:00+00',
  'U.S. nonprofit or mission-driven for-profit with a demonstrated commitment to social justice. Technology must be the primary vehicle for community impact.',
  ARRAY['us-based', 'social-enterprise', 'community-serving', 'tech-enabled'],
  ARRAY['social-justice', 'legal-empowerment', 'civic-tech'],
  '{"national": true}'::jsonb,
  true,
  'demo_g15_ford_tech_justice_2026',
  'active'
),
(
  '00000000-0000-0000-0001-000000000016',
  'foundations',
  'https://knightfoundation.org/grants/demo',
  'https://knightfoundation.org/grants/demo',
  'Knight Foundation: Informed & Engaged Communities Grant',
  'The Knight Foundation funds innovations that foster informed and engaged communities. 2026 priority areas include information access technology, civic tools that lower participation barriers, and AI applications that improve democratic engagement for underserved populations.',
  'John S. and James L. Knight Foundation',
  'foundation',
  25000, 150000,
  '2026-08-30 17:00:00+00',
  'U.S. nonprofit or social enterprise. Project must address information access or civic engagement. Demonstrable community benefit required.',
  ARRAY['us-based', 'community-serving', 'social-enterprise'],
  ARRAY['civic-tech', 'information-access', 'community-engagement'],
  '{"national": true}'::jsonb,
  true,
  'demo_g16_knight_civic_2026',
  'active'
),
(
  '00000000-0000-0000-0001-000000000017',
  'foundations',
  'https://wkkellogg.org/grants/racial-equity/demo',
  'https://wkkellogg.org/grants/racial-equity/demo',
  'W.K. Kellogg Foundation: Racial Equity & Community Investment',
  'The W.K. Kellogg Foundation''s racial equity grantmaking funds organizations led by people of color that are advancing economic opportunity, education, and health for vulnerable communities. Priority given to initiatives with systems-change potential.',
  'W.K. Kellogg Foundation',
  'foundation',
  100000, 500000,
  '2026-10-15 17:00:00+00',
  'U.S. 501(c)(3) or BIPOC-led for-profit with clear community impact. Leadership team must be majority people of color. Focus on economic mobility, education, or health outcomes.',
  ARRAY['nonprofit', 'minority-led', 'community-serving', 'us-based'],
  ARRAY['racial-equity', 'economic-mobility', 'community-investment'],
  '{"national": true}'::jsonb,
  true,
  'demo_g17_kellogg_racial_equity_2026',
  'active'
),
(
  '00000000-0000-0000-0001-000000000018',
  'foundations',
  'https://gatesfoundation.org/grants/workforce-equity/demo',
  'https://gatesfoundation.org/grants/workforce-equity/demo',
  'Gates Foundation: Equitable Technology & Workforce Innovation',
  'The Bill & Melinda Gates Foundation funds technology-enabled innovations addressing workforce equity, economic mobility, and access to opportunity for underserved populations in the United States. Emphasis on scalable platforms with a clear path to community-level impact.',
  'Bill & Melinda Gates Foundation',
  'foundation',
  75000, 300000,
  '2026-11-15 17:00:00+00',
  'U.S. nonprofit or mission-driven for-profit, technology-enabled approach, measurable impact on economic equity or workforce outcomes required.',
  ARRAY['us-based', 'tech-enabled', 'community-serving', 'social-enterprise'],
  ARRAY['workforce-equity', 'economic-mobility', 'technology-access'],
  '{"national": true}'::jsonb,
  true,
  'demo_g18_gates_workforce_equity_2026',
  'active'
),

-- NICHE (2)
(
  '00000000-0000-0000-0001-000000000019',
  'niche',
  'https://ifundwomen.com/grants/demo',
  'https://ifundwomen.com/grants/demo',
  'IFundWomen: Universal Grant — Technology Category',
  'IFundWomen''s Universal Grant provides unrestricted funding to women-owned and minority-owned businesses. The technology category supports founders building digital products, SaaS platforms, and tech-enabled services with clear customer traction or market validation.',
  'IFundWomen',
  'niche',
  5000, 25000,
  '2026-07-15 17:00:00+00',
  'Women-owned or minority-owned U.S. business, early stage, technology-enabled product or service with some customer validation.',
  ARRAY['women-owned', 'minority-owned', 'us-based', 'tech-company'],
  ARRAY['women-founders', 'tech-startup', 'minority-business'],
  '{"national": true}'::jsonb,
  false,
  'demo_g19_ifundwomen_tech_2026',
  'active'
),
(
  '00000000-0000-0000-0001-000000000020',
  'niche',
  'https://helloalice.com/grants/demo',
  'https://helloalice.com/grants/demo',
  'Hello Alice: Small Business Grant — Technology & Innovation',
  'Hello Alice quarterly business grants support small business owners building companies across the United States. The technology and innovation category prioritizes founders building software products, AI tools, or tech-enabled service businesses with evidence of market fit.',
  'Hello Alice',
  'niche',
  5000, 15000,
  '2026-07-22 17:00:00+00',
  'U.S. small business owner, under 100 employees. Open to all demographics.',
  ARRAY['us-based', 'small-business', 'for-profit'],
  ARRAY['small-business', 'technology', 'innovation'],
  '{"national": true}'::jsonb,
  false,
  'demo_g20_hello_alice_tech_2026',
  'active'
);

-- ─── GRANT MATCHES (5) ───────────────────────────────────────────────────────
-- Match 1: TCS + Google Black Founders — 82.5 — pending_review (has application)
-- Match 2: TCS + MBDA Capacity — 74.0 — pending_review (has application)
-- Match 3: TCS + SBIR Phase I — 68.5 — queued
-- Match 4: FlowTech + JPMorgan Black Pathways — 71.0 — pending_review
-- Match 5: FlowTech + CA SBDC — 56.5 — queued

INSERT INTO grant_matches (
  id, grant_id, entity_id,
  hard_filter_passed, hard_filter_failures,
  fit_score, matched_angles,
  status
) VALUES
(
  '00000000-0000-0000-0002-000000000001',
  '00000000-0000-0000-0001-000000000010',
  '00000000-0000-0000-0000-000000000001',
  true, '{}'::text[],
  82.5,
  ARRAY[
    'Black-led AI legal tech closing the justice access gap',
    'First plain-English contract AI for solopreneurs',
    'Scalable tech with demonstrated early traction',
    'Los Angeles community anchor — Google ecosystem alignment'
  ],
  'pending_review'
),
(
  '00000000-0000-0000-0002-000000000002',
  '00000000-0000-0000-0001-000000000003',
  '00000000-0000-0000-0000-000000000001',
  true, '{}'::text[],
  74.0,
  ARRAY[
    'Minority-owned business capacity building narrative',
    'Technology-enabled operational infrastructure investment',
    'Los Angeles community anchor with measurable impact plan'
  ],
  'pending_review'
),
(
  '00000000-0000-0000-0002-000000000003',
  '00000000-0000-0000-0001-000000000002',
  '00000000-0000-0000-0000-000000000001',
  true, '{}'::text[],
  68.5,
  ARRAY[
    'AI-powered compliance tool with clear commercialization path',
    'Novel LLM application to legal plain-English conversion',
    'Technical feasibility demonstrated via working prototype'
  ],
  'queued'
),
(
  '00000000-0000-0000-0002-000000000004',
  '00000000-0000-0000-0001-000000000011',
  '00000000-0000-0000-0000-000000000002',
  true, '{}'::text[],
  71.0,
  ARRAY[
    'Minority-owned growth-stage SaaS with revenue history',
    'Community impact through SMB revenue enablement',
    'Los Angeles market traction and community ties'
  ],
  'pending_review'
),
(
  '00000000-0000-0000-0002-000000000005',
  '00000000-0000-0000-0001-000000000006',
  '00000000-0000-0000-0000-000000000002',
  true, '{}'::text[],
  56.5,
  ARRAY[
    'California small business technology adoption fit',
    'Operational infrastructure investment alignment'
  ],
  'queued'
);

-- ─── GRANT APPLICATIONS (2) ──────────────────────────────────────────────────
-- Both for TCS — fully written, passed QA, awaiting human review

INSERT INTO grant_applications (
  id, grant_match_id, entity_id, grant_id,
  draft_content, research_notes,
  selected_angles, selected_framework,
  humanizer_applied, uniqueness_score,
  qa_scores, qa_passed,
  status, deadline
) VALUES
(
  '00000000-0000-0000-0003-000000000001',
  '00000000-0000-0000-0002-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0001-000000000010',
  '{
    "executive_summary": "The Clear State is an AI-powered legal operations platform that converts contracts, compliance requirements, and regulatory filings into plain-English action steps for solopreneurs and micro-businesses. Founded in 2021 by Donameche Jackson in Los Angeles, TCS has developed F.L.O. (Flexible Legal Operations) — the first AI tool purpose-built to eliminate the legal comprehension gap that costs U.S. small businesses an estimated $40B annually in missed opportunities and compliance penalties. We are requesting Google for Startups Black Founders Fund support to accelerate AI model development, deepen our product research with 50 target users, and build the go-to-market infrastructure necessary to serve 1,000 Los Angeles small business owners by end of 2027.",
    "problem_statement": "74% of small business owners report losing at least one deal per year because of contract confusion or compliance gaps — yet 89% say they cannot afford a business attorney for routine matters. Legal complexity is the single largest operational barrier for solopreneurs, particularly in underserved communities where the cost of a mistake is existential rather than recoverable. Existing legal tech tools are built for enterprises with in-house counsel. Nothing substantive exists for the one-person LLC trying to understand a vendor agreement at 11pm before a 9am signing.",
    "proposed_solution": "F.L.O. ingests any business document — contract, lease, vendor agreement, NDA, compliance filing — and outputs a plain-English summary, a ranked list of risk flags, and a specific action checklist the owner can execute without a law degree. Unlike legal chatbots that give generic advice regardless of document context, F.L.O. is trained on the specific document in question, producing owner-level action steps rather than attorney-level legal interpretation. Early users report a 60% reduction in contract review time and a 23% improvement in deal close rates after resolving previously unknown contract friction points.",
    "organizational_capacity": "Donameche Jackson holds a background in operations and product strategy, with prior experience managing compliance workflows for a 50-person professional services firm — the experience that revealed the gap TCS is built to close. The Clear State is structured as a California LLC operating on a lean, AI-first development model. The platform runs on modern cloud infrastructure with zero direct legal liability exposure: TCS provides information and workflow tools, not legal advice. P.L.O.T. (Plain-Language Operational Tracker) is currently in development as the second product in the suite.",
    "use_of_funds": "Google for Startups award funds will be deployed across three priorities: (1) AI Model Development — $25,000 for fine-tuning on a small-business legal document corpus, improving context retention and plain-language output quality; (2) User Research — $15,000 for structured product research with 50 target users across Los Angeles, including SBDC referrals and Chamber of Commerce members; (3) Go-to-Market Infrastructure — $10,000 for CRM setup, content development, and community partnerships with local SBDC chapters, SCORE, and the California Black Chamber of Commerce.",
    "pass_history": ["draft", "critique", "revision", "humanizer", "uniqueness"]
  }'::jsonb,
  '{
    "funder_profile": "Google for Startups Black Founders Fund prioritizes: (1) Black-founded companies with AI-enabled differentiation, (2) early traction metrics (users, revenue, or pilots), (3) a clear commercialization pathway, and (4) founder narrative aligned with community impact. Reviewers respond to specific numbers over general mission statements.",
    "language_patterns": ["accessibility", "underserved founders", "ecosystem-building", "technical differentiation", "scalable business model"],
    "prior_winners_context": "Prior winners include Partake Foods, Squire, and Maison de Mode — all had clear customer data and community narrative. None were in legal tech. Differentiation opportunity: TCS is the only legal tech applicant with a Black founder and an access-to-justice angle.",
    "rubric_emphasis": "Application scored on: innovation (30%), impact (25%), scalability (25%), team (20%)"
  }'::jsonb,
  ARRAY[
    'Black-led AI legal tech closing the justice access gap',
    'First plain-English contract AI for solopreneurs',
    'Los Angeles community anchor — ecosystem alignment'
  ],
  'equity-tech-first',
  true,
  0.12,
  '{"narrative": 8.4, "clarity": 7.8, "compliance": 8.6, "gate": "passed"}'::jsonb,
  true,
  'pending_review',
  '2026-07-15 17:00:00+00'
),
(
  '00000000-0000-0000-0003-000000000002',
  '00000000-0000-0000-0002-000000000002',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0001-000000000003',
  '{
    "executive_summary": "The Clear State requests $75,000 in MBDA capacity-building support to scale operational infrastructure, accelerate AI model development, and build the community partnerships necessary to serve 500 minority-owned small businesses in the Los Angeles metro area by Q4 2027. Founded in 2021 by Donameche Jackson — a Black entrepreneur navigating the exact legal complexity TCS is built to solve — The Clear State is both a product and a proof of concept: that minority-owned businesses can build AI infrastructure that closes gaps the market has ignored.",
    "organizational_background": "The Clear State is a Black-owned, AI-powered legal operations company headquartered in Los Angeles, California. Our flagship product, F.L.O. (Flexible Legal Operations), reduces the time small business owners spend deciphering contracts and compliance requirements from hours to minutes. TCS was incorporated in California in 2021 and has operated continuously since, building toward our first commercial product launch. We are 100% founder-funded to date — grant funding represents our first institutional capital, and we have selected MBDA as the right partner because of our deep alignment with MBDA''s mandate to expand minority business wealth creation through technology.",
    "capacity_building_plan": "This grant will fund four capacity pillars over 18 months: (1) Technology Infrastructure ($30,000) — cloud computing upgrades, AI model training pipeline, and security compliance for handling sensitive business documents; (2) Operational Systems ($20,000) — CRM implementation, project management tooling, and financial reporting infrastructure to support 10x user growth; (3) Market Development ($15,000) — structured outreach to LA-area MBDA Business Centers, SCORE chapters, and the California Black Chamber of Commerce to build a referral pipeline; (4) Workforce ($10,000) — part-time contractor to handle customer success and onboarding as product scales.",
    "impact_metrics": "By Q4 2027, TCS projects: 500 minority-owned businesses served through F.L.O.; $2.1M in aggregate deal value unlocked for clients based on current $4,200 average deal value per active user; 12 active partnerships with regional small business support organizations; and 2 full-time equivalent jobs created in Los Angeles.",
    "community_alignment": "The Clear State was built in Los Angeles and serves Los Angeles. Our founding story is inseparable from the legal barriers Donameche Jackson encountered as a first-generation entrepreneur navigating California LLC formation, vendor agreements, and regulatory filings without access to legal counsel. Every product decision at TCS is stress-tested against that lived experience — because our target user is the person we were three years ago.",
    "pass_history": ["draft", "critique", "revision", "humanizer", "uniqueness"]
  }'::jsonb,
  '{
    "funder_profile": "MBDA reviewers prioritize a clear capacity-building narrative (not just product development), specific and verifiable community ties to the MBDA mission, and measurable outcomes tied to MBDA strategic goals of minority business wealth creation and job growth.",
    "language_patterns": ["wealth creation", "ecosystem development", "measurable impact", "capacity building", "community anchor", "job creation"],
    "rubric_emphasis": "Budget must clearly distinguish operational vs. program spend. Community ties must be specific — names of partner organizations, not general statements.",
    "strategic_notes": "TCS qualifies on all hard eligibility criteria: minority-owned, U.S.-based, 1+ year operating. Differentiation angle: being a tech company building tools for other minority businesses creates a multiplier effect that aligns with MBDA''s ecosystem mission."
  }'::jsonb,
  ARRAY[
    'Minority-owned business capacity building narrative',
    'Technology-enabled operational infrastructure investment',
    'Community multiplier — tech serving other minority businesses'
  ],
  'capacity-impact',
  true,
  0.08,
  '{"narrative": 7.9, "clarity": 8.1, "compliance": 8.3, "gate": "passed"}'::jsonb,
  true,
  'pending_review',
  '2026-08-15 17:00:00+00'
);
