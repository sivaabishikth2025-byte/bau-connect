export const INTERESTS = [
  "Music", "Sports", "Gaming", "Art", "Travel", "Cooking",
  "Reading", "Fitness", "Movies", "Tech", "Fashion", "Photography",
];

/** What kinds of campus connections someone is open to */
export const OPEN_TO = [
  "Carpool",
  "Study groups",
  "Explore DC",
  "Coffee chats",
  "Sports & fitness",
  "Campus events",
  "Food runs",
  "Language exchange",
  "Volunteering",
] as const;

export type OpenToOption = (typeof OPEN_TO)[number];

export const ACTIVITY_TYPES = [
  { id: "carpool", label: "Carpool", emoji: "🚗", color: "#28AAE2" },
  { id: "hangout", label: "Hangout", emoji: "☕", color: "#DBA631" },
  { id: "study", label: "Study", emoji: "📚", color: "#1C2D5A" },
  { id: "explore", label: "Explore area", emoji: "🗺️", color: "#CBDB2A" },
  { id: "sports", label: "Sports", emoji: "⚽", color: "#F15B47" },
  { id: "other", label: "Other", emoji: "✨", color: "#888" },
] as const;

export type ActivityTypeId = (typeof ACTIVITY_TYPES)[number]["id"];

export function activityMeta(type: string) {
  return ACTIVITY_TYPES.find(t => t.id === type) ?? ACTIVITY_TYPES[ACTIVITY_TYPES.length - 1];
}

export const VOLUNTEER_CATEGORIES = [
  { id: "events", label: "Campus events", color: "#DBA631" },
  { id: "orientation", label: "Orientation", color: "#28AAE2" },
  { id: "tutoring", label: "Peer tutoring", color: "#1C2D5A" },
  { id: "community", label: "Community service", color: "#CBDB2A" },
  { id: "admin", label: "Office & admin", color: "#F15B47" },
  { id: "other", label: "Other", color: "#888" },
] as const;

export type VolunteerCategoryId = (typeof VOLUNTEER_CATEGORIES)[number]["id"];

export function volunteerCategoryMeta(id: string) {
  return VOLUNTEER_CATEGORIES.find(c => c.id === id) ?? VOLUNTEER_CATEGORIES[VOLUNTEER_CATEGORIES.length - 1];
}

export const VOLUNTEER_APP_STATUSES = [
  { id: "applied", label: "Applied", color: "#28AAE2" },
  { id: "reviewing", label: "Reviewing", color: "#DBA631" },
  { id: "hired", label: "Hired", color: "#2F9E6B" },
  { id: "waitlisted", label: "Waitlisted", color: "#7B6BBF" },
  { id: "declined", label: "Declined", color: "#F15B47" },
  { id: "withdrawn", label: "Withdrawn", color: "#888" },
] as const;

export function volunteerAppStatusMeta(id: string) {
  return VOLUNTEER_APP_STATUSES.find(s => s.id === id) ?? VOLUNTEER_APP_STATUSES[0];
}

/** BAU main campus: 1510 H Street NW, Washington, DC (OSM building centroid) */
export const BAU_CAMPUS = {
  name: "Bay Atlantic University",
  address: "1510 H Street NW, Washington, DC 20005",
  lat: 38.89993,
  lng: -77.0343,
  phone: "+1 (202) 644-7200",
  website: "https://bau.edu/location/",
} as const;

export const CAMPUS_LOCATIONS = [
  { id: "bay", name: "The Bay (Student Union)", floor: "Multiple", blurb: "Community hub: events, seating, and student life.", lat: 38.89993, lng: -77.0343, kind: "campus" as const },
  { id: "library", name: "Library & study areas", floor: "2", blurb: "Quiet study, resources, and group tables.", lat: 38.89993, lng: -77.0343, kind: "campus" as const },
  { id: "cyber", name: "Cyber Security Lab", floor: "2", blurb: "Specialized lab space for tech programs.", lat: 38.89993, lng: -77.0343, kind: "campus" as const },
  { id: "computer", name: "Computer Lab", floor: "2", blurb: "27-station lab for coursework and projects.", lat: 38.89993, lng: -77.0343, kind: "campus" as const },
  { id: "auditorium", name: "Auditorium", floor: "3", blurb: "Combined classrooms for talks and events (~100 seats).", lat: 38.89993, lng: -77.0343, kind: "campus" as const },
  { id: "game", name: "Game Room", floor: "Campus", blurb: "Relax and meet people between classes.", lat: 38.89993, lng: -77.0343, kind: "campus" as const },
  { id: "writing", name: "Writing Center", floor: "Campus", blurb: "Support for papers and academic writing.", lat: 38.89993, lng: -77.0343, kind: "campus" as const },
  { id: "outdoor", name: "Outdoor seating", floor: "Ground", blurb: "Meet up outside near H Street.", lat: 38.89988, lng: -77.03425, kind: "campus" as const },
  { id: "deli", name: "Campus deli", floor: "1", blurb: "Meals, snacks, and drinks on the first floor.", lat: 38.89993, lng: -77.0343, kind: "campus" as const },
  { id: "admissions", name: "Admissions & front desk", floor: "1", blurb: "Tours, check-in, and campus information.", lat: 38.89993, lng: -77.0343, kind: "campus" as const },
] as const;

/** Metro stations within easy reach of BAU — shown on the campus map by default */
export const NEAR_CAMPUS_TRANSIT_IDS = [
  "mcpherson",
  "metro-center",
  "farragut-west",
  "farragut-north",
  "gallery-place",
  "federal-triangle",
  "archives",
  "judiciary",
  "foggy-bottom",
  "smithsonian",
] as const;

export const TRANSIT_SPOTS = [
  { id: "mcpherson", name: "McPherson Square", note: "Orange / Silver / Blue: closest to BAU, ~3 min walk", lat: 38.901363, lng: -77.032006, kind: "transit" as const },
  { id: "farragut-west", name: "Farragut West", note: "Orange / Silver / Blue: ~8 min walk", lat: 38.90135, lng: -77.040446, kind: "transit" as const },
  { id: "farragut-north", name: "Farragut North", note: "Red Line: ~10 min walk", lat: 38.903296, lng: -77.039734, kind: "transit" as const },
  { id: "metro-center", name: "Metro Center", note: "Red / Orange / Silver / Blue: downtown transfer", lat: 38.897792, lng: -77.028011, kind: "transit" as const },
  { id: "gallery-place", name: "Gallery Place-Chinatown", note: "Red / Green / Yellow: Capital One Arena", lat: 38.898329, lng: -77.022578, kind: "transit" as const },
  { id: "federal-triangle", name: "Federal Triangle", note: "Orange / Silver / Blue: toward the Mall", lat: 38.893722, lng: -77.028030, kind: "transit" as const },
  { id: "archives", name: "Archives-Navy Memorial-Penn Quarter", note: "Green / Yellow: National Archives", lat: 38.893234, lng: -77.021884, kind: "transit" as const },
  { id: "judiciary", name: "Judiciary Square", note: "Red Line: National Building Museum", lat: 38.896081, lng: -77.016643, kind: "transit" as const },
  { id: "mt-vernon", name: "Mt Vernon Sq / 7th St-Convention Center", note: "Green / Yellow", lat: 38.905937, lng: -77.022255, kind: "transit" as const },
  { id: "shaw", name: "Shaw-Howard University", note: "Green / Yellow: Howard University", lat: 38.915016, lng: -77.021911, kind: "transit" as const },
  { id: "u-street", name: "U Street / African-Amer Civil War Memorial / Cardozo", note: "Green / Yellow: U Street nightlife", lat: 38.916554, lng: -77.028834, kind: "transit" as const },
  { id: "columbia-heights", name: "Columbia Heights", note: "Green / Yellow: 14th Street corridor", lat: 38.927837, lng: -77.032552, kind: "transit" as const },
  { id: "dupont", name: "Dupont Circle", note: "Red Line: restaurants and nightlife", lat: 38.909499, lng: -77.043620, kind: "transit" as const },
  { id: "woodley", name: "Woodley Park-Zoo / Adams Morgan", note: "Red Line: National Zoo, Adams Morgan", lat: 38.924432, lng: -77.052137, kind: "transit" as const },
  { id: "cleveland-park", name: "Cleveland Park", note: "Red Line", lat: 38.934703, lng: -77.058226, kind: "transit" as const },
  { id: "van-ness", name: "Van Ness-UDC", note: "Red Line: University of the District of Columbia", lat: 38.943620, lng: -77.063511, kind: "transit" as const },
  { id: "tenleytown", name: "Tenleytown-AU", note: "Red Line: American University", lat: 38.947808, lng: -77.079615, kind: "transit" as const },
  { id: "friendship-heights", name: "Friendship Heights", note: "Red Line: DC / Maryland line", lat: 38.960792, lng: -77.085942, kind: "transit" as const },
  { id: "foggy-bottom", name: "Foggy Bottom-GWU", note: "Orange / Silver / Blue: GW / Kennedy Center", lat: 38.900762, lng: -77.050318, kind: "transit" as const },
  { id: "smithsonian", name: "Smithsonian", note: "Orange / Silver / Blue: Mall museums", lat: 38.888516, lng: -77.028557, kind: "transit" as const },
  { id: "lenfant", name: "L'Enfant Plaza", note: "Orange / Silver / Blue / Green / Yellow", lat: 38.884851, lng: -77.021914, kind: "transit" as const },
  { id: "federal-center", name: "Federal Center SW", note: "Orange / Silver / Blue", lat: 38.884958, lng: -77.015868, kind: "transit" as const },
  { id: "union-station-metro", name: "Union Station", note: "Red Line: Amtrak, MARC, VRE, buses", lat: 38.897766, lng: -77.006313, kind: "transit" as const },
  { id: "noma", name: "NoMa-Gallaudet U", note: "Red Line: Union Market nearby", lat: 38.907407, lng: -77.003021, kind: "transit" as const },
  { id: "rhode-island", name: "Rhode Island Ave-Brentwood", note: "Red Line", lat: 38.919749, lng: -76.995648, kind: "transit" as const },
  { id: "brookland", name: "Brookland-CUA", note: "Red Line: Catholic University", lat: 38.933234, lng: -76.994544, kind: "transit" as const },
  { id: "fort-totten", name: "Fort Totten", note: "Red / Green / Yellow transfer", lat: 38.951777, lng: -77.002174, kind: "transit" as const },
  { id: "takoma", name: "Takoma", note: "Red Line: DC / Maryland line", lat: 38.975532, lng: -77.017834, kind: "transit" as const },
  { id: "capitol-south", name: "Capitol South", note: "Orange / Silver / Blue: U.S. Capitol", lat: 38.885072, lng: -77.005583, kind: "transit" as const },
  { id: "eastern-market", name: "Eastern Market", note: "Orange / Silver / Blue: Capitol Hill market", lat: 38.884124, lng: -76.995648, kind: "transit" as const },
  { id: "potomac-ave", name: "Potomac Avenue", note: "Orange / Silver / Blue", lat: 38.880841, lng: -76.985218, kind: "transit" as const },
  { id: "stadium-armory", name: "Stadium-Armory", note: "Orange / Silver / Blue / Blue to Largo", lat: 38.886709, lng: -76.977088, kind: "transit" as const },
  { id: "benning", name: "Benning Road", note: "Blue / Silver", lat: 38.890388, lng: -76.938432, kind: "transit" as const },
  { id: "minnesota", name: "Minnesota Avenue", note: "Orange Line", lat: 38.899191, lng: -76.946747, kind: "transit" as const },
  { id: "deanwood", name: "Deanwood", note: "Orange Line", lat: 38.907734, lng: -76.936323, kind: "transit" as const },
  { id: "navy-yard", name: "Navy Yard-Ballpark", note: "Green Line: Nationals Park", lat: 38.876481, lng: -77.002767, kind: "transit" as const },
  { id: "waterfront", name: "Waterfront", note: "Green Line: SW / The Wharf nearby", lat: 38.876221, lng: -77.017505, kind: "transit" as const },
  { id: "anacostia", name: "Anacostia", note: "Green Line", lat: 38.862072, lng: -76.995334, kind: "transit" as const },
  { id: "congress-heights", name: "Congress Heights", note: "Green Line", lat: 38.845334, lng: -76.988656, kind: "transit" as const },
  { id: "southern-ave", name: "Southern Avenue", note: "Green Line: DC / Maryland line", lat: 38.840974, lng: -76.975054, kind: "transit" as const },
  { id: "rosslyn", name: "Rosslyn", note: "Orange / Silver / Blue: Arlington, Key Bridge", lat: 38.896595, lng: -77.071460, kind: "transit" as const },
  { id: "arlington-cemetery", name: "Arlington Cemetery", note: "Blue Line", lat: 38.884574, lng: -77.063108, kind: "transit" as const },
  { id: "pentagon", name: "Pentagon", note: "Blue / Yellow", lat: 38.869349, lng: -77.054013, kind: "transit" as const },
  { id: "pentagon-city", name: "Pentagon City", note: "Blue / Yellow: shopping", lat: 38.861884, lng: -77.059538, kind: "transit" as const },
  { id: "crystal-city", name: "Crystal City", note: "Blue / Yellow", lat: 38.857790, lng: -77.050589, kind: "transit" as const },
  { id: "national-airport", name: "Ronald Reagan Washington National Airport", note: "Blue / Yellow: DCA", lat: 38.852985, lng: -77.043418, kind: "transit" as const },
  { id: "court-house", name: "Court House", note: "Orange / Silver: Arlington", lat: 38.891321, lng: -77.084995, kind: "transit" as const },
  { id: "clarendon", name: "Clarendon", note: "Orange / Silver", lat: 38.886373, lng: -77.096963, kind: "transit" as const },
  { id: "virginia-square", name: "Virginia Square-GMU", note: "Orange / Silver: George Mason Arlington", lat: 38.882775, lng: -77.104165, kind: "transit" as const },
  { id: "ballston", name: "Ballston-MU", note: "Orange / Silver", lat: 38.882071, lng: -77.111845, kind: "transit" as const },
] as const;

export const EXPLORE_DC = [
  { id: "whitehouse", name: "White House", note: "1600 Pennsylvania Ave NW: ~6 min walk from BAU", lat: 38.897639, lng: -77.036552, kind: "area" as const },
  { id: "lafayette", name: "Lafayette Square", note: "Park across from the White House: 2 blocks from campus", lat: 38.899507, lng: -77.036544, kind: "area" as const },
  { id: "mcpherson-park", name: "McPherson Square Park", note: "Food trucks next to campus", lat: 38.901200, lng: -77.033900, kind: "area" as const },
  { id: "farragut-square", name: "Farragut Square", note: "Lunch-hour park on K Street", lat: 38.901900, lng: -77.039100, kind: "area" as const },
  { id: "renwick", name: "Renwick Gallery", note: "Smithsonian American craft: Pennsylvania Ave", lat: 38.898842, lng: -77.039456, kind: "area" as const },
  { id: "chinatown", name: "Chinatown Friendship Arch", note: "7th & H St NW: Gallery Place", lat: 38.899400, lng: -77.022200, kind: "area" as const },
  { id: "capital-one-arena", name: "Capital One Arena", note: "Capitals, Wizards, concerts", lat: 38.898115, lng: -77.020948, kind: "area" as const },
  { id: "spy-museum", name: "International Spy Museum", note: "L'Enfant Plaza: interactive exhibits", lat: 38.88380, lng: -77.02580, kind: "area" as const },
  { id: "fords", name: "Ford's Theatre", note: "Historic theatre on 10th Street NW", lat: 38.89660, lng: -77.02570, kind: "area" as const },
  { id: "portrait", name: "National Portrait Gallery", note: "8th & F: free Smithsonian", lat: 38.89770, lng: -77.02300, kind: "area" as const },
  { id: "american-art", name: "Smithsonian American Art Museum", note: "Shares the building with Portrait Gallery", lat: 38.89790, lng: -77.02320, kind: "area" as const },
  { id: "building-museum", name: "National Building Museum", note: "Judiciary Square: giant Corinthian columns", lat: 38.89770, lng: -77.01770, kind: "area" as const },
  { id: "archives-bldg", name: "National Archives", note: "Constitution Ave: Declaration of Independence", lat: 38.89260, lng: -77.02300, kind: "area" as const },
  { id: "navy-memorial", name: "United States Navy Memorial", note: "Pennsylvania Ave at 8th Street", lat: 38.89400, lng: -77.02300, kind: "area" as const },
  { id: "mall", name: "National Mall", note: "Monuments, museums, and long walks", lat: 38.88950, lng: -77.02300, kind: "area" as const },
  { id: "washington-monument", name: "Washington Monument", note: "Center of the Mall", lat: 38.889475, lng: -77.035243, kind: "area" as const },
  { id: "lincoln", name: "Lincoln Memorial", note: "West end of the Mall: Reflecting Pool", lat: 38.889265, lng: -77.050211, kind: "area" as const },
  { id: "vietnam", name: "Vietnam Veterans Memorial", note: "Constitution Gardens, near Lincoln", lat: 38.89110, lng: -77.04770, kind: "area" as const },
  { id: "korean", name: "Korean War Veterans Memorial", note: "South of the Reflecting Pool", lat: 38.88780, lng: -77.04750, kind: "area" as const },
  { id: "jefferson", name: "Jefferson Memorial", note: "Tidal Basin: cherry blossoms in spring", lat: 38.88140, lng: -77.03650, kind: "area" as const },
  { id: "wwii", name: "World War II Memorial", note: "Between the Monument and Lincoln Memorial", lat: 38.88940, lng: -77.04050, kind: "area" as const },
  { id: "mlk", name: "Martin Luther King, Jr. Memorial", note: "Tidal Basin, west of the Jefferson", lat: 38.88620, lng: -77.04420, kind: "area" as const },
  { id: "fdr", name: "Franklin Delano Roosevelt Memorial", note: "West Tidal Basin", lat: 38.88390, lng: -77.04440, kind: "area" as const },
  { id: "holocaust", name: "United States Holocaust Memorial Museum", note: "Near 14th Street and Independence Ave SW", lat: 38.88680, lng: -77.03290, kind: "area" as const },
  { id: "african-american", name: "National Museum of African American History and Culture", note: "Smithsonian on the Mall: timed tickets", lat: 38.89110, lng: -77.03290, kind: "area" as const },
  { id: "smithsonian-castle", name: "Smithsonian Castle", note: "Visitor center for the Mall museums", lat: 38.88816, lng: -77.02602, kind: "area" as const },
  { id: "hirshhorn", name: "Hirshhorn Museum", note: "Modern art on the Mall", lat: 38.88816, lng: -77.02299, kind: "area" as const },
  { id: "air-space", name: "National Air and Space Museum", note: "Mall: aircraft and space history", lat: 38.88816, lng: -77.01990, kind: "area" as const },
  { id: "natural-history", name: "National Museum of Natural History", note: "Mall: dinosaurs and the Hope Diamond", lat: 38.89127, lng: -77.02610, kind: "area" as const },
  { id: "american-history", name: "National Museum of American History", note: "Mall: Star-Spangled Banner", lat: 38.89127, lng: -77.03000, kind: "area" as const },
  { id: "nga", name: "National Gallery of Art", note: "West Building on the Mall", lat: 38.89127, lng: -77.01997, kind: "area" as const },
  { id: "nga-east", name: "National Gallery of Art East Building", note: "Modern wing + sculpture garden", lat: 38.89130, lng: -77.01690, kind: "area" as const },
  { id: "us-capitol", name: "U.S. Capitol", note: "East end of the Mall", lat: 38.889813, lng: -77.009021, kind: "area" as const },
  { id: "supreme-court", name: "Supreme Court", note: "1 First St NE", lat: 38.89064, lng: -77.00444, kind: "area" as const },
  { id: "library-congress", name: "Library of Congress", note: "Thomas Jefferson Building: free tours", lat: 38.88868, lng: -77.00469, kind: "area" as const },
  { id: "botanic", name: "U.S. Botanic Garden", note: "First Street SW, next to the Capitol", lat: 38.88810, lng: -77.01290, kind: "area" as const },
  { id: "union-station", name: "Union Station (main hall)", note: "Food hall, Amtrak, and buses", lat: 38.89710, lng: -77.00630, kind: "area" as const },
  { id: "union-market", name: "Union Market", note: "NE food hall near NoMa", lat: 38.90870, lng: -76.99690, kind: "area" as const },
  { id: "eastern-mkt", name: "Eastern Market", note: "Capitol Hill weekend market", lat: 38.88650, lng: -76.99680, kind: "area" as const },
  { id: "georgetown", name: "Georgetown (M Street)", note: "Shops, late-night food, waterfront nearby", lat: 38.90500, lng: -77.06260, kind: "area" as const },
  { id: "georgetown-waterfront", name: "Georgetown waterfront", note: "Potomac promenade and restaurants", lat: 38.90120, lng: -77.06080, kind: "area" as const },
  { id: "kennedy-center", name: "John F. Kennedy Center", note: "Performances and rooftop views", lat: 38.89590, lng: -77.05530, kind: "area" as const },
  { id: "wharf", name: "The Wharf", note: "SW waterfront: restaurants and concerts", lat: 38.88000, lng: -77.02530, kind: "area" as const },
  { id: "nationals", name: "Nationals Park", note: "Navy Yard: baseball", lat: 38.87300, lng: -77.00740, kind: "area" as const },
  { id: "audi-field", name: "Audi Field", note: "D.C. United soccer", lat: 38.86880, lng: -77.01290, kind: "area" as const },
  { id: "zoo", name: "Smithsonian National Zoo", note: "Woodley Park", lat: 38.92960, lng: -77.04970, kind: "area" as const },
  { id: "cathedral", name: "Washington National Cathedral", note: "Wisconsin Ave NW: Gothic landmark", lat: 38.93080, lng: -77.07060, kind: "area" as const },
  { id: "adams-morgan", name: "Adams Morgan", note: "18th Street NW: nightlife and food", lat: 38.92150, lng: -77.04220, kind: "area" as const },
  { id: "u-street-corridor", name: "U Street corridor", note: "Live music, Ben’s Chili Bowl, Howard Theatre", lat: 38.91700, lng: -77.02880, kind: "area" as const },
  { id: "howard-theatre", name: "Howard Theatre", note: "Historic venue near Shaw", lat: 38.91520, lng: -77.02110, kind: "area" as const },
  { id: "phillips", name: "The Phillips Collection", note: "Dupont Circle: America’s first museum of modern art", lat: 38.91150, lng: -77.04680, kind: "area" as const },
  { id: "national-geo", name: "National Geographic Museum", note: "17th & M Street NW", lat: 38.90520, lng: -77.03800, kind: "area" as const },
  { id: "arlington-cemetery-grounds", name: "Arlington National Cemetery", note: "Across the Potomac: Changing of the Guard", lat: 38.87600, lng: -77.06900, kind: "area" as const },
  { id: "iwo-jima", name: "Marine Corps War Memorial (Iwo Jima)", note: "Arlington: overlooks DC", lat: 38.89040, lng: -77.06970, kind: "area" as const },
  { id: "rock-creek", name: "Rock Creek Park (Peirce Mill area)", note: "Trails and woods inside the city", lat: 38.94000, lng: -77.05170, kind: "area" as const },
] as const;

export const DC_SPOTS = [...TRANSIT_SPOTS, ...EXPLORE_DC];

export { ADMIN_EMAIL, isAdminEmail } from "@/lib/admin";

export const MAP_LAYERS = [
  { id: "campus", label: "BAU campus", color: "#28AAE2" },
  { id: "transit", label: "Transit", color: "#DBA631" },
  { id: "area", label: "Explore DC", color: "#F15B47" },
] as const;

export const MAX_GALLERY_PHOTOS = 6;

export const APP_NAME = "BAU Connect";
