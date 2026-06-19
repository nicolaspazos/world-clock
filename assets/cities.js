/* Glint Global Sales Clock — city database
 * Each entry: id, city, country, cc (ISO-3166-1 alpha-2), tz (IANA), lat, lng
 * Coordinates are city-center, accurate enough for world-scale pin placement.
 * Curated heavy on Nico's active markets: US (Two Dot Media), Singapore,
 * Dubai/Gulf, Australia — plus the major global business hubs.
 */
const CITY_DB = [
  // ── South & Central America ───────────────────────────────────────────
  { id:'buenos-aires', city:'Buenos Aires', country:'Argentina',   cc:'AR', tz:'America/Argentina/Buenos_Aires', lat:-34.61, lng:-58.38 },
  { id:'cordoba-ar',   city:'Córdoba',       country:'Argentina',   cc:'AR', tz:'America/Argentina/Cordoba',      lat:-31.42, lng:-64.18 },
  { id:'montevideo',   city:'Montevideo',    country:'Uruguay',     cc:'UY', tz:'America/Montevideo',  lat:-34.90, lng:-56.16 },
  { id:'santiago',     city:'Santiago',      country:'Chile',       cc:'CL', tz:'America/Santiago',    lat:-33.45, lng:-70.67 },
  { id:'sao-paulo',    city:'São Paulo',     country:'Brazil',      cc:'BR', tz:'America/Sao_Paulo',   lat:-23.55, lng:-46.63 },
  { id:'rio',          city:'Rio de Janeiro',country:'Brazil',      cc:'BR', tz:'America/Sao_Paulo',   lat:-22.91, lng:-43.17 },
  { id:'lima',         city:'Lima',          country:'Peru',        cc:'PE', tz:'America/Lima',        lat:-12.05, lng:-77.04 },
  { id:'bogota',       city:'Bogotá',        country:'Colombia',    cc:'CO', tz:'America/Bogota',      lat: 4.71,  lng:-74.07 },
  { id:'quito',        city:'Quito',         country:'Ecuador',     cc:'EC', tz:'America/Guayaquil',   lat:-0.18,  lng:-78.47 },
  { id:'caracas',      city:'Caracas',       country:'Venezuela',   cc:'VE', tz:'America/Caracas',     lat:10.48,  lng:-66.90 },
  { id:'panama',       city:'Panama City',   country:'Panama',      cc:'PA', tz:'America/Panama',      lat: 8.98,  lng:-79.52 },
  { id:'mexico-city',  city:'Mexico City',   country:'Mexico',      cc:'MX', tz:'America/Mexico_City', lat:19.43,  lng:-99.13 },

  // ── North America ─────────────────────────────────────────────────────
  { id:'new-york',     city:'New York',      country:'United States', cc:'US', tz:'America/New_York',    lat:40.71, lng:-74.01 },
  { id:'washington',   city:'Washington DC', country:'United States', cc:'US', tz:'America/New_York',    lat:38.91, lng:-77.04 },
  { id:'boston',       city:'Boston',        country:'United States', cc:'US', tz:'America/New_York',    lat:42.36, lng:-71.06 },
  { id:'atlanta',      city:'Atlanta',       country:'United States', cc:'US', tz:'America/New_York',    lat:33.75, lng:-84.39 },
  { id:'miami',        city:'Miami',         country:'United States', cc:'US', tz:'America/New_York',    lat:25.76, lng:-80.19 },
  { id:'chicago',      city:'Chicago',       country:'United States', cc:'US', tz:'America/Chicago',     lat:41.88, lng:-87.63 },
  { id:'dallas',       city:'Dallas',        country:'United States', cc:'US', tz:'America/Chicago',     lat:32.78, lng:-96.80 },
  { id:'houston',      city:'Houston',       country:'United States', cc:'US', tz:'America/Chicago',     lat:29.76, lng:-95.37 },
  { id:'minneapolis',  city:'Minneapolis',   country:'United States', cc:'US', tz:'America/Chicago',     lat:44.98, lng:-93.27 },
  { id:'denver',       city:'Denver',        country:'United States', cc:'US', tz:'America/Denver',      lat:39.74, lng:-104.99 },
  { id:'phoenix',      city:'Phoenix',       country:'United States', cc:'US', tz:'America/Phoenix',     lat:33.45, lng:-112.07 },
  { id:'los-angeles',  city:'Los Angeles',   country:'United States', cc:'US', tz:'America/Los_Angeles', lat:34.05, lng:-118.24 },
  { id:'san-francisco',city:'San Francisco', country:'United States', cc:'US', tz:'America/Los_Angeles', lat:37.77, lng:-122.42 },
  { id:'seattle',      city:'Seattle',       country:'United States', cc:'US', tz:'America/Los_Angeles', lat:47.61, lng:-122.33 },
  { id:'las-vegas',    city:'Las Vegas',     country:'United States', cc:'US', tz:'America/Los_Angeles', lat:36.17, lng:-115.14 },
  { id:'anchorage',    city:'Anchorage',     country:'United States', cc:'US', tz:'America/Anchorage',   lat:61.22, lng:-149.90 },
  { id:'honolulu',     city:'Honolulu',      country:'United States', cc:'US', tz:'Pacific/Honolulu',    lat:21.31, lng:-157.86 },
  { id:'toronto',      city:'Toronto',       country:'Canada',        cc:'CA', tz:'America/Toronto',      lat:43.65, lng:-79.38 },
  { id:'vancouver',    city:'Vancouver',     country:'Canada',        cc:'CA', tz:'America/Vancouver',    lat:49.28, lng:-123.12 },

  // ── Europe ────────────────────────────────────────────────────────────
  { id:'london',       city:'London',        country:'United Kingdom', cc:'GB', tz:'Europe/London',    lat:51.51, lng:-0.13 },
  { id:'dublin',       city:'Dublin',        country:'Ireland',        cc:'IE', tz:'Europe/Dublin',    lat:53.35, lng:-6.26 },
  { id:'lisbon',       city:'Lisbon',        country:'Portugal',       cc:'PT', tz:'Europe/Lisbon',    lat:38.72, lng:-9.14 },
  { id:'madrid',       city:'Madrid',        country:'Spain',          cc:'ES', tz:'Europe/Madrid',    lat:40.42, lng:-3.70 },
  { id:'barcelona',    city:'Barcelona',     country:'Spain',          cc:'ES', tz:'Europe/Madrid',    lat:41.39, lng:2.17 },
  { id:'paris',        city:'Paris',         country:'France',         cc:'FR', tz:'Europe/Paris',     lat:48.86, lng:2.35 },
  { id:'amsterdam',    city:'Amsterdam',     country:'Netherlands',    cc:'NL', tz:'Europe/Amsterdam', lat:52.37, lng:4.90 },
  { id:'brussels',     city:'Brussels',      country:'Belgium',        cc:'BE', tz:'Europe/Brussels',  lat:50.85, lng:4.35 },
  { id:'berlin',       city:'Berlin',        country:'Germany',        cc:'DE', tz:'Europe/Berlin',    lat:52.52, lng:13.40 },
  { id:'frankfurt',    city:'Frankfurt',     country:'Germany',        cc:'DE', tz:'Europe/Berlin',    lat:50.11, lng:8.68 },
  { id:'munich',       city:'Munich',        country:'Germany',        cc:'DE', tz:'Europe/Berlin',    lat:48.14, lng:11.58 },
  { id:'zurich',       city:'Zürich',        country:'Switzerland',    cc:'CH', tz:'Europe/Zurich',    lat:47.38, lng:8.54 },
  { id:'geneva',       city:'Geneva',        country:'Switzerland',    cc:'CH', tz:'Europe/Zurich',    lat:46.20, lng:6.14 },
  { id:'milan',        city:'Milan',         country:'Italy',          cc:'IT', tz:'Europe/Rome',      lat:45.46, lng:9.19 },
  { id:'rome',         city:'Rome',          country:'Italy',          cc:'IT', tz:'Europe/Rome',      lat:41.90, lng:12.50 },
  { id:'vienna',       city:'Vienna',        country:'Austria',        cc:'AT', tz:'Europe/Vienna',    lat:48.21, lng:16.37 },
  { id:'copenhagen',   city:'Copenhagen',    country:'Denmark',        cc:'DK', tz:'Europe/Copenhagen',lat:55.68, lng:12.57 },
  { id:'stockholm',    city:'Stockholm',     country:'Sweden',         cc:'SE', tz:'Europe/Stockholm', lat:59.33, lng:18.06 },
  { id:'oslo',         city:'Oslo',          country:'Norway',         cc:'NO', tz:'Europe/Oslo',      lat:59.91, lng:10.75 },
  { id:'helsinki',     city:'Helsinki',      country:'Finland',        cc:'FI', tz:'Europe/Helsinki',  lat:60.17, lng:24.94 },
  { id:'warsaw',       city:'Warsaw',        country:'Poland',         cc:'PL', tz:'Europe/Warsaw',    lat:52.23, lng:21.01 },
  { id:'prague',       city:'Prague',        country:'Czechia',        cc:'CZ', tz:'Europe/Prague',    lat:50.08, lng:14.44 },
  { id:'budapest',     city:'Budapest',      country:'Hungary',        cc:'HU', tz:'Europe/Budapest',  lat:47.50, lng:19.04 },
  { id:'athens',       city:'Athens',        country:'Greece',         cc:'GR', tz:'Europe/Athens',    lat:37.98, lng:23.73 },
  { id:'bucharest',    city:'Bucharest',     country:'Romania',        cc:'RO', tz:'Europe/Bucharest', lat:44.43, lng:26.10 },
  { id:'istanbul',     city:'Istanbul',      country:'Türkiye',        cc:'TR', tz:'Europe/Istanbul',  lat:41.01, lng:28.98 },
  { id:'kyiv',         city:'Kyiv',          country:'Ukraine',        cc:'UA', tz:'Europe/Kyiv',      lat:50.45, lng:30.52 },
  { id:'moscow',       city:'Moscow',        country:'Russia',         cc:'RU', tz:'Europe/Moscow',    lat:55.76, lng:37.62 },

  // ── Middle East & Africa ──────────────────────────────────────────────
  { id:'dubai',        city:'Dubai',         country:'UAE',          cc:'AE', tz:'Asia/Dubai',          lat:25.20, lng:55.27 },
  { id:'abu-dhabi',    city:'Abu Dhabi',     country:'UAE',          cc:'AE', tz:'Asia/Dubai',          lat:24.45, lng:54.38 },
  { id:'doha',         city:'Doha',          country:'Qatar',        cc:'QA', tz:'Asia/Qatar',          lat:25.29, lng:51.53 },
  { id:'riyadh',       city:'Riyadh',        country:'Saudi Arabia', cc:'SA', tz:'Asia/Riyadh',         lat:24.71, lng:46.68 },
  { id:'jeddah',       city:'Jeddah',        country:'Saudi Arabia', cc:'SA', tz:'Asia/Riyadh',         lat:21.49, lng:39.18 },
  { id:'kuwait-city',  city:'Kuwait City',   country:'Kuwait',       cc:'KW', tz:'Asia/Kuwait',         lat:29.38, lng:47.99 },
  { id:'manama',       city:'Manama',        country:'Bahrain',      cc:'BH', tz:'Asia/Bahrain',        lat:26.23, lng:50.59 },
  { id:'muscat',       city:'Muscat',        country:'Oman',         cc:'OM', tz:'Asia/Muscat',         lat:23.59, lng:58.41 },
  { id:'tel-aviv',     city:'Tel Aviv',      country:'Israel',       cc:'IL', tz:'Asia/Jerusalem',      lat:32.08, lng:34.78 },
  { id:'cairo',        city:'Cairo',         country:'Egypt',        cc:'EG', tz:'Africa/Cairo',        lat:30.04, lng:31.24 },
  { id:'tehran',       city:'Tehran',        country:'Iran',         cc:'IR', tz:'Asia/Tehran',         lat:35.69, lng:51.39 },
  { id:'casablanca',   city:'Casablanca',    country:'Morocco',      cc:'MA', tz:'Africa/Casablanca',   lat:33.57, lng:-7.59 },
  { id:'lagos',        city:'Lagos',         country:'Nigeria',      cc:'NG', tz:'Africa/Lagos',        lat:6.52,  lng:3.38 },
  { id:'accra',        city:'Accra',         country:'Ghana',        cc:'GH', tz:'Africa/Accra',        lat:5.60,  lng:-0.19 },
  { id:'nairobi',      city:'Nairobi',       country:'Kenya',        cc:'KE', tz:'Africa/Nairobi',      lat:-1.29, lng:36.82 },
  { id:'addis-ababa',  city:'Addis Ababa',   country:'Ethiopia',     cc:'ET', tz:'Africa/Addis_Ababa',  lat:9.03,  lng:38.74 },
  { id:'johannesburg', city:'Johannesburg',  country:'South Africa', cc:'ZA', tz:'Africa/Johannesburg', lat:-26.20,lng:28.05 },
  { id:'cape-town',    city:'Cape Town',     country:'South Africa', cc:'ZA', tz:'Africa/Johannesburg', lat:-33.92,lng:18.42 },

  // ── Asia ──────────────────────────────────────────────────────────────
  { id:'singapore',    city:'Singapore',     country:'Singapore',    cc:'SG', tz:'Asia/Singapore',      lat:1.35,  lng:103.82 },
  { id:'kuala-lumpur', city:'Kuala Lumpur',  country:'Malaysia',     cc:'MY', tz:'Asia/Kuala_Lumpur',   lat:3.14,  lng:101.69 },
  { id:'jakarta',      city:'Jakarta',       country:'Indonesia',    cc:'ID', tz:'Asia/Jakarta',        lat:-6.21, lng:106.85 },
  { id:'bangkok',      city:'Bangkok',       country:'Thailand',     cc:'TH', tz:'Asia/Bangkok',        lat:13.76, lng:100.50 },
  { id:'hanoi',        city:'Hanoi',         country:'Vietnam',      cc:'VN', tz:'Asia/Ho_Chi_Minh',    lat:21.03, lng:105.85 },
  { id:'ho-chi-minh',  city:'Ho Chi Minh City',country:'Vietnam',   cc:'VN', tz:'Asia/Ho_Chi_Minh',    lat:10.82, lng:106.63 },
  { id:'manila',       city:'Manila',        country:'Philippines',  cc:'PH', tz:'Asia/Manila',         lat:14.60, lng:120.98 },
  { id:'hong-kong',    city:'Hong Kong',     country:'Hong Kong',    cc:'HK', tz:'Asia/Hong_Kong',      lat:22.32, lng:114.17 },
  { id:'taipei',       city:'Taipei',        country:'Taiwan',       cc:'TW', tz:'Asia/Taipei',         lat:25.03, lng:121.57 },
  { id:'shanghai',     city:'Shanghai',      country:'China',        cc:'CN', tz:'Asia/Shanghai',       lat:31.23, lng:121.47 },
  { id:'beijing',      city:'Beijing',       country:'China',        cc:'CN', tz:'Asia/Shanghai',       lat:39.90, lng:116.41 },
  { id:'shenzhen',     city:'Shenzhen',      country:'China',        cc:'CN', tz:'Asia/Shanghai',       lat:22.54, lng:114.06 },
  { id:'tokyo',        city:'Tokyo',         country:'Japan',        cc:'JP', tz:'Asia/Tokyo',          lat:35.68, lng:139.69 },
  { id:'osaka',        city:'Osaka',         country:'Japan',        cc:'JP', tz:'Asia/Tokyo',          lat:34.69, lng:135.50 },
  { id:'seoul',        city:'Seoul',         country:'South Korea',  cc:'KR', tz:'Asia/Seoul',          lat:37.57, lng:126.98 },
  { id:'mumbai',       city:'Mumbai',        country:'India',        cc:'IN', tz:'Asia/Kolkata',        lat:19.08, lng:72.88 },
  { id:'new-delhi',    city:'New Delhi',     country:'India',        cc:'IN', tz:'Asia/Kolkata',        lat:28.61, lng:77.21 },
  { id:'bangalore',    city:'Bangalore',     country:'India',        cc:'IN', tz:'Asia/Kolkata',        lat:12.97, lng:77.59 },
  { id:'hyderabad',    city:'Hyderabad',     country:'India',        cc:'IN', tz:'Asia/Kolkata',        lat:17.39, lng:78.49 },
  { id:'chennai',      city:'Chennai',       country:'India',        cc:'IN', tz:'Asia/Kolkata',        lat:13.08, lng:80.27 },
  { id:'colombo',      city:'Colombo',       country:'Sri Lanka',    cc:'LK', tz:'Asia/Colombo',        lat:6.93,  lng:79.86 },
  { id:'dhaka',        city:'Dhaka',         country:'Bangladesh',   cc:'BD', tz:'Asia/Dhaka',          lat:23.81, lng:90.41 },
  { id:'karachi',      city:'Karachi',       country:'Pakistan',     cc:'PK', tz:'Asia/Karachi',        lat:24.86, lng:67.01 },
  { id:'lahore',       city:'Lahore',        country:'Pakistan',     cc:'PK', tz:'Asia/Karachi',        lat:31.55, lng:74.34 },
  { id:'islamabad',    city:'Islamabad',     country:'Pakistan',     cc:'PK', tz:'Asia/Karachi',        lat:33.69, lng:73.06 },
  { id:'almaty',       city:'Almaty',        country:'Kazakhstan',   cc:'KZ', tz:'Asia/Almaty',         lat:43.24, lng:76.89 },
  { id:'tashkent',     city:'Tashkent',      country:'Uzbekistan',   cc:'UZ', tz:'Asia/Tashkent',       lat:41.30, lng:69.24 },

  // ── Oceania ───────────────────────────────────────────────────────────
  { id:'sydney',       city:'Sydney',        country:'Australia',    cc:'AU', tz:'Australia/Sydney',    lat:-33.87, lng:151.21 },
  { id:'melbourne',    city:'Melbourne',     country:'Australia',    cc:'AU', tz:'Australia/Melbourne', lat:-37.81, lng:144.96 },
  { id:'canberra',     city:'Canberra',      country:'Australia',    cc:'AU', tz:'Australia/Sydney',    lat:-35.28, lng:149.13 },
  { id:'brisbane',     city:'Brisbane',      country:'Australia',    cc:'AU', tz:'Australia/Brisbane',  lat:-27.47, lng:153.03 },
  { id:'gold-coast',   city:'Gold Coast',    country:'Australia',    cc:'AU', tz:'Australia/Brisbane',  lat:-28.02, lng:153.40 },
  { id:'adelaide',     city:'Adelaide',      country:'Australia',    cc:'AU', tz:'Australia/Adelaide',  lat:-34.93, lng:138.60 },
  { id:'perth',        city:'Perth',         country:'Australia',    cc:'AU', tz:'Australia/Perth',     lat:-31.95, lng:115.86 },
  { id:'darwin',       city:'Darwin',        country:'Australia',    cc:'AU', tz:'Australia/Darwin',    lat:-12.46, lng:130.84 },
  { id:'auckland',     city:'Auckland',      country:'New Zealand',  cc:'NZ', tz:'Pacific/Auckland',    lat:-36.85, lng:174.76 },
  { id:'wellington',   city:'Wellington',    country:'New Zealand',  cc:'NZ', tz:'Pacific/Auckland',    lat:-41.29, lng:174.78 }
];

/* Default working set — Nico's locked markets, in display order.
 * home = Buenos Aires. Notes map to his niches from CLAUDE.md. */
const DEFAULT_STATE = {
  home: 'buenos-aires',
  hours: { start: 9, end: 18 },   // your working window, home-local
  use24h: true,
  sort: 'pinned',
  cities: [
    { id:'buenos-aires', pinned:true, note:'Home base' },
    { id:'new-york',     pinned:true, note:'Two Dot Media · US ET' },
    { id:'dubai',        pinned:true, note:'Medical · Holdings' },
    { id:'singapore',    pinned:true, note:'Marine · Finance' },
    { id:'sydney',       pinned:true, note:'Paving · AU' },
    { id:'london',       pinned:true, note:'Reference' }
  ]
};

/* Countries whose working week is Sun–Thu (weekend = Fri & Sat). */
const FRI_SAT_WEEKEND = new Set(['AE','SA','QA','KW','BH','OM','EG','IL','JO']);
