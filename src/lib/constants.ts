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
  lat: 38.8999303,
  lng: -77.0342998,
  phone: "+1 (202) 644-7200",
  website: "https://bau.edu/location/",
} as const;

export const BUILDING_FLOORS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

/** Floors with interactive GLB models in /public/models */
export const FLOORS_WITH_MODELS = ["1", "2", "3", "4", "6", "7", "8", "9"] as const;

export function hasFloorModel(floor: string) {
  return (FLOORS_WITH_MODELS as readonly string[]).includes(floor);
}

export function floorLabel(floor: string) {
  if (floor === "1") return "The Bay";
  const n = Number(floor);
  if (!Number.isFinite(n) || n < 1) return floor;
  const suffix =
    n % 10 === 1 && n % 100 !== 11 ? "st"
    : n % 10 === 2 && n % 100 !== 12 ? "nd"
    : n % 10 === 3 && n % 100 !== 13 ? "rd"
    : "th";
  return `${n}${suffix} floor`;
}

export const CAMPUS_LOCATIONS = [
  { id: "bay", name: "The Bay (Student Union)", floor: "1", blurb: "Community hub: events, seating, and student life.", lat: 38.8999303, lng: -77.0342998, kind: "campus" as const },
  { id: "library", name: "Library & study areas", floor: "2", blurb: "Quiet study, resources, and group tables.", lat: 38.8999303, lng: -77.0342998, kind: "campus" as const },
  { id: "cyber", name: "Cyber Security Lab", floor: "2", blurb: "Specialized lab space for tech programs.", lat: 38.8999303, lng: -77.0342998, kind: "campus" as const },
  { id: "computer", name: "Computer Lab", floor: "2", blurb: "27-station lab for coursework and projects.", lat: 38.8999303, lng: -77.0342998, kind: "campus" as const },
  { id: "auditorium", name: "Auditorium", floor: "3", blurb: "Combined classrooms for talks and events (~100 seats).", lat: 38.8999303, lng: -77.0342998, kind: "campus" as const },
  { id: "game", name: "Game Room", floor: "Campus", blurb: "Relax and meet people between classes.", lat: 38.8999303, lng: -77.0342998, kind: "campus" as const },
  { id: "writing", name: "Writing Center", floor: "Campus", blurb: "Support for papers and academic writing.", lat: 38.8999303, lng: -77.0342998, kind: "campus" as const },
  { id: "outdoor", name: "Outdoor seating", floor: "Ground", blurb: "Meet up outside near H Street.", lat: 38.899880, lng: -77.034250, kind: "campus" as const },
  { id: "deli", name: "Campus deli", floor: "1", blurb: "Meals, snacks, and drinks on The Bay level.", lat: 38.8999303, lng: -77.0342998, kind: "campus" as const },
  { id: "admissions", name: "Admissions & front desk", floor: "1", blurb: "Tours, check-in, and campus information.", lat: 38.8999303, lng: -77.0342998, kind: "campus" as const },
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
  { id: "mcpherson", name: "McPherson Square", note: "Orange / Silver / Blue: closest to BAU, ~3 min walk", lat: 38.901341, lng: -77.033636, kind: "transit" as const },
  { id: "farragut-west", name: "Farragut West", note: "Orange / Silver / Blue: ~8 min walk", lat: 38.901321, lng: -77.040698, kind: "transit" as const },
  { id: "farragut-north", name: "Farragut North", note: "Red Line: ~10 min walk", lat: 38.90321, lng: -77.039703, kind: "transit" as const },
  { id: "metro-center", name: "Metro Center", note: "Red / Orange / Silver / Blue: downtown transfer", lat: 38.898322, lng: -77.02808, kind: "transit" as const },
  { id: "gallery-place", name: "Gallery Place-Chinatown", note: "Red / Green / Yellow: Capital One Arena", lat: 38.898325, lng: -77.021918, kind: "transit" as const },
  { id: "federal-triangle", name: "Federal Triangle", note: "Orange / Silver / Blue: toward the Mall", lat: 38.893189, lng: -77.028134, kind: "transit" as const },
  { id: "archives", name: "Archives-Navy Memorial-Penn Quarter", note: "Green / Yellow: National Archives", lat: 38.893673, lng: -77.021917, kind: "transit" as const },
  { id: "judiciary", name: "Judiciary Square", note: "Red Line: National Building Museum", lat: 38.896098, lng: -77.016641, kind: "transit" as const },
  { id: "mt-vernon", name: "Mt Vernon Sq / 7th St-Convention Center", note: "Green / Yellow", lat: 38.906445, lng: -77.021917, kind: "transit" as const },
  { id: "shaw", name: "Shaw-Howard University", note: "Green / Yellow: Howard University", lat: 38.913485, lng: -77.021914, kind: "transit" as const },
  { id: "u-street", name: "U Street / African-Amer Civil War Memorial / Cardozo", note: "Green / Yellow: U Street nightlife", lat: 38.91701, lng: -77.027498, kind: "transit" as const },
  { id: "columbia-heights", name: "Columbia Heights", note: "Green / Yellow: 14th Street corridor", lat: 38.927846, lng: -77.032554, kind: "transit" as const },
  { id: "dupont", name: "Dupont Circle", note: "Red Line: restaurants and nightlife", lat: 38.909606, lng: -77.043417, kind: "transit" as const },
  { id: "woodley", name: "Woodley Park-Zoo / Adams Morgan", note: "Red Line: National Zoo, Adams Morgan", lat: 38.925093, lng: -77.05242, kind: "transit" as const },
  { id: "cleveland-park", name: "Cleveland Park", note: "Red Line", lat: 38.934771, lng: -77.058045, kind: "transit" as const },
  { id: "van-ness", name: "Van Ness-UDC", note: "Red Line: University of the District of Columbia", lat: 38.943273, lng: -77.062988, kind: "transit" as const },
  { id: "tenleytown", name: "Tenleytown-AU", note: "Red Line: American University", lat: 38.948859, lng: -77.07959, kind: "transit" as const },
  { id: "friendship-heights", name: "Friendship Heights", note: "Red Line: DC / Maryland line", lat: 38.959492, lng: -77.084998, kind: "transit" as const },
  { id: "foggy-bottom", name: "Foggy Bottom-GWU", note: "Orange / Silver / Blue: GW / Kennedy Center", lat: 38.900706, lng: -77.05028, kind: "transit" as const },
  { id: "smithsonian", name: "Smithsonian", note: "Orange / Silver / Blue: Mall museums", lat: 38.888026, lng: -77.028069, kind: "transit" as const },
  { id: "lenfant", name: "L'Enfant Plaza", note: "Orange / Silver / Blue / Green / Yellow", lat: 38.884846, lng: -77.021911, kind: "transit" as const },
  { id: "federal-center", name: "Federal Center SW", note: "Orange / Silver / Blue", lat: 38.88508, lng: -77.015871, kind: "transit" as const },
  { id: "union-station-metro", name: "Union Station", note: "Red Line: Amtrak, MARC, VRE, buses", lat: 38.897774, lng: -77.007417, kind: "transit" as const },
  { id: "noma", name: "NoMa-Gallaudet U", note: "Red Line: Union Market nearby", lat: 38.907024, lng: -77.003023, kind: "transit" as const },
  { id: "rhode-island", name: "Rhode Island Ave-Brentwood", note: "Red Line", lat: 38.921067, lng: -76.995939, kind: "transit" as const },
  { id: "brookland", name: "Brookland-CUA", note: "Red Line: Catholic University", lat: 38.933219, lng: -76.994537, kind: "transit" as const },
  { id: "fort-totten", name: "Fort Totten", note: "Red / Green / Yellow transfer", lat: 38.951855, lng: -77.002205, kind: "transit" as const },
  { id: "takoma", name: "Takoma", note: "Red Line: DC / Maryland line", lat: 38.976086, lng: -77.018179, kind: "transit" as const },
  { id: "capitol-south", name: "Capitol South", note: "Orange / Silver / Blue: U.S. Capitol", lat: 38.88507, lng: -77.005142, kind: "transit" as const },
  { id: "eastern-market", name: "Eastern Market", note: "Orange / Silver / Blue: Capitol Hill market", lat: 38.88463, lng: -76.996003, kind: "transit" as const },
  { id: "potomac-ave", name: "Potomac Avenue", note: "Orange / Silver / Blue", lat: 38.881271, lng: -76.985498, kind: "transit" as const },
  { id: "stadium-armory", name: "Stadium-Armory", note: "Orange / Silver / Blue / Blue to Largo", lat: 38.886717, lng: -76.977091, kind: "transit" as const },
  { id: "benning", name: "Benning Road", note: "Blue / Silver", lat: 38.890983, lng: -76.938367, kind: "transit" as const },
  { id: "minnesota", name: "Minnesota Avenue", note: "Orange Line", lat: 38.899199, lng: -76.94675, kind: "transit" as const },
  { id: "deanwood", name: "Deanwood", note: "Orange Line", lat: 38.908186, lng: -76.935259, kind: "transit" as const },
  { id: "navy-yard", name: "Navy Yard-Ballpark", note: "Green Line: Nationals Park", lat: 38.876489, lng: -77.005088, kind: "transit" as const },
  { id: "waterfront", name: "Waterfront", note: "Green Line: SW / The Wharf nearby", lat: 38.87647, lng: -77.017507, kind: "transit" as const },
  { id: "anacostia", name: "Anacostia", note: "Green Line", lat: 38.862971, lng: -76.995373, kind: "transit" as const },
  { id: "congress-heights", name: "Congress Heights", note: "Green Line", lat: 38.845665, lng: -76.988514, kind: "transit" as const },
  { id: "southern-ave", name: "Southern Avenue", note: "Green Line: DC / Maryland line", lat: 38.841094, lng: -76.975056, kind: "transit" as const },
  { id: "rosslyn", name: "Rosslyn", note: "Orange / Silver / Blue: Arlington, Key Bridge", lat: 38.895987, lng: -77.070911, kind: "transit" as const },
  { id: "arlington-cemetery", name: "Arlington Cemetery", note: "Blue Line", lat: 38.884695, lng: -77.062812, kind: "transit" as const },
  { id: "pentagon", name: "Pentagon", note: "Blue / Yellow", lat: 38.86947, lng: -77.053718, kind: "transit" as const },
  { id: "pentagon-city", name: "Pentagon City", note: "Blue / Yellow: shopping", lat: 38.86189, lng: -77.059541, kind: "transit" as const },
  { id: "crystal-city", name: "Crystal City", note: "Blue / Yellow", lat: 38.857912, lng: -77.050292, kind: "transit" as const },
  { id: "national-airport", name: "Ronald Reagan Washington National Airport", note: "Blue / Yellow: DCA", lat: 38.853424, lng: -77.044045, kind: "transit" as const },
  { id: "court-house", name: "Court House", note: "Orange / Silver: Arlington", lat: 38.890183, lng: -77.087134, kind: "transit" as const },
  { id: "clarendon", name: "Clarendon", note: "Orange / Silver", lat: 38.886713, lng: -77.095396, kind: "transit" as const },
  { id: "virginia-square", name: "Virginia Square-GMU", note: "Orange / Silver: George Mason Arlington", lat: 38.883374, lng: -77.10298, kind: "transit" as const },
  { id: "ballston", name: "Ballston-MU", note: "Orange / Silver", lat: 38.882191, lng: -77.113171, kind: "transit" as const },
] as const;

export const EXPLORE_DC = [
  { id: "whitehouse", name: "White House", note: "1600 Pennsylvania Ave NW: ~6 min walk from BAU", lat: 38.897639, lng: -77.036552, kind: "area" as const },
  { id: "lafayette", name: "Lafayette Square", note: "Park across from the White House: 2 blocks from campus", lat: 38.899507, lng: -77.036544, kind: "area" as const },
  { id: "mcpherson-park", name: "McPherson Square Park", note: "Food trucks next to campus", lat: 38.901363, lng: -77.032006, kind: "area" as const },
  { id: "farragut-square", name: "Farragut Square", note: "Lunch-hour park on K Street", lat: 38.901965, lng: -77.038968, kind: "area" as const },
  { id: "renwick", name: "Renwick Gallery", note: "Smithsonian American craft: Pennsylvania Ave", lat: 38.899173, lng: -77.039072, kind: "area" as const },
  { id: "chinatown", name: "Chinatown Friendship Arch", note: "7th & H St NW: Gallery Place", lat: 38.899816, lng: -77.021647, kind: "area" as const },
  { id: "capital-one-arena", name: "Capital One Arena", note: "Capitals, Wizards, concerts", lat: 38.898188, lng: -77.020938, kind: "area" as const },
  { id: "spy-museum", name: "International Spy Museum", note: "L'Enfant Plaza: interactive exhibits", lat: 38.883955, lng: -77.025537, kind: "area" as const },
  { id: "fords", name: "Ford's Theatre", note: "Historic theatre on 10th Street NW", lat: 38.896676, lng: -77.025645, kind: "area" as const },
  { id: "portrait", name: "National Portrait Gallery", note: "8th & F: free Smithsonian", lat: 38.897866, lng: -77.022372, kind: "area" as const },
  { id: "american-art", name: "Smithsonian American Art Museum", note: "Shares the building with Portrait Gallery", lat: 38.897866, lng: -77.02359, kind: "area" as const },
  { id: "building-museum", name: "National Building Museum", note: "Judiciary Square: giant Corinthian columns", lat: 38.897755, lng: -77.017551, kind: "area" as const },
  { id: "archives-bldg", name: "National Archives", note: "Constitution Ave: Declaration of Independence", lat: 38.893137, lng: -77.023041, kind: "area" as const },
  { id: "navy-memorial", name: "United States Navy Memorial", note: "Pennsylvania Ave at 8th Street", lat: 38.894002, lng: -77.022944, kind: "area" as const },
  { id: "mall", name: "National Mall", note: "Monuments, museums, and long walks", lat: 38.88964, lng: -77.02693, kind: "area" as const },
  { id: "washington-monument", name: "Washington Monument", note: "Center of the Mall", lat: 38.889475, lng: -77.035243, kind: "area" as const },
  { id: "lincoln", name: "Lincoln Memorial", note: "West end of the Mall: Reflecting Pool", lat: 38.889265, lng: -77.050211, kind: "area" as const },
  { id: "vietnam", name: "Vietnam Veterans Memorial", note: "Constitution Gardens, near Lincoln", lat: 38.890897, lng: -77.047736, kind: "area" as const },
  { id: "korean", name: "Korean War Veterans Memorial", note: "South of the Reflecting Pool", lat: 38.887904, lng: -77.048046, kind: "area" as const },
  { id: "jefferson", name: "Jefferson Memorial", note: "Tidal Basin: cherry blossoms in spring", lat: 38.881418, lng: -77.036551, kind: "area" as const },
  { id: "wwii", name: "World War II Memorial", note: "Between the Monument and Lincoln Memorial", lat: 38.889394, lng: -77.040482, kind: "area" as const },
  { id: "mlk", name: "Martin Luther King, Jr. Memorial", note: "Tidal Basin, west of the Jefferson", lat: 38.885866, lng: -77.044646, kind: "area" as const },
  { id: "fdr", name: "Franklin Delano Roosevelt Memorial", note: "West Tidal Basin", lat: 38.883297, lng: -77.042737, kind: "area" as const },
  { id: "holocaust", name: "United States Holocaust Memorial Museum", note: "Near 14th Street and Independence Ave SW", lat: 38.886638, lng: -77.03275, kind: "area" as const },
  { id: "african-american", name: "National Museum of African American History and Culture", note: "Smithsonian on the Mall: timed tickets", lat: 38.891067, lng: -77.032704, kind: "area" as const },
  { id: "smithsonian-castle", name: "Smithsonian Castle", note: "Visitor center for the Mall museums", lat: 38.888795, lng: -77.025938, kind: "area" as const },
  { id: "hirshhorn", name: "Hirshhorn Museum", note: "Modern art on the Mall", lat: 38.888165, lng: -77.023257, kind: "area" as const },
  { id: "air-space", name: "National Air and Space Museum", note: "Mall: aircraft and space history", lat: 38.888135, lng: -77.019815, kind: "area" as const },
  { id: "natural-history", name: "National Museum of Natural History", note: "Mall: dinosaurs and the Hope Diamond", lat: 38.891245, lng: -77.02597, kind: "area" as const },
  { id: "american-history", name: "National Museum of American History", note: "Mall: Star-Spangled Banner", lat: 38.89124, lng: -77.030021, kind: "area" as const },
  { id: "nga", name: "National Gallery of Art", note: "West Building on the Mall", lat: 38.891297, lng: -77.019969, kind: "area" as const },
  { id: "nga-east", name: "National Gallery of Art East Building", note: "Modern wing + sculpture garden", lat: 38.891406, lng: -77.017814, kind: "area" as const },
  { id: "us-capitol", name: "U.S. Capitol", note: "East end of the Mall", lat: 38.889813, lng: -77.009021, kind: "area" as const },
  { id: "supreme-court", name: "Supreme Court", note: "1 First St NE", lat: 38.890593, lng: -77.004439, kind: "area" as const },
  { id: "library-congress", name: "Library of Congress", note: "Thomas Jefferson Building: free tours", lat: 38.888674, lng: -77.004636, kind: "area" as const },
  { id: "botanic", name: "U.S. Botanic Garden", note: "First Street SW, next to the Capitol", lat: 38.88834, lng: -77.013218, kind: "area" as const },
  { id: "union-station", name: "Union Station (main hall)", note: "Food hall, Amtrak, and buses", lat: 38.897766, lng: -77.007414, kind: "area" as const },
  { id: "union-market", name: "Union Market", note: "NE food hall near NoMa", lat: 38.90861, lng: -76.997405, kind: "area" as const },
  { id: "eastern-mkt", name: "Eastern Market", note: "Capitol Hill weekend market", lat: 38.884249, lng: -76.995823, kind: "area" as const },
  { id: "georgetown", name: "Georgetown (M Street)", note: "Shops, late-night food, waterfront nearby", lat: 38.905199, lng: -77.062785, kind: "area" as const },
  { id: "georgetown-waterfront", name: "Georgetown waterfront", note: "Potomac promenade and restaurants", lat: 38.902735, lng: -77.064932, kind: "area" as const },
  { id: "kennedy-center", name: "John F. Kennedy Center", note: "Performances and rooftop views", lat: 38.895736, lng: -77.055759, kind: "area" as const },
  { id: "wharf", name: "The Wharf", note: "SW waterfront: restaurants and concerts", lat: 38.877373, lng: -77.022296, kind: "area" as const },
  { id: "nationals", name: "Nationals Park", note: "Navy Yard: baseball", lat: 38.872733, lng: -77.007481, kind: "area" as const },
  { id: "audi-field", name: "Audi Field", note: "D.C. United soccer", lat: 38.868261, lng: -77.012609, kind: "area" as const },
  { id: "zoo", name: "Smithsonian National Zoo", note: "Woodley Park", lat: 38.929615, lng: -77.049758, kind: "area" as const },
  { id: "cathedral", name: "Washington National Cathedral", note: "Wisconsin Ave NW: Gothic landmark", lat: 38.930651, lng: -77.070595, kind: "area" as const },
  { id: "adams-morgan", name: "Adams Morgan", note: "18th Street NW: nightlife and food", lat: 38.9215, lng: -77.042199, kind: "area" as const },
  { id: "u-street-corridor", name: "U Street corridor", note: "Live music, Ben’s Chili Bowl, Howard Theatre", lat: 38.916995, lng: -77.027393, kind: "area" as const },
  { id: "howard-theatre", name: "Howard Theatre", note: "Historic venue near Shaw", lat: 38.915314, lng: -77.021094, kind: "area" as const },
  { id: "phillips", name: "The Phillips Collection", note: "Dupont Circle: America’s first museum of modern art", lat: 38.911602, lng: -77.046886, kind: "area" as const },
  { id: "national-geo", name: "National Geographic Museum", note: "17th & M Street NW", lat: 38.904961, lng: -77.03811, kind: "area" as const },
  { id: "arlington-cemetery-grounds", name: "Arlington National Cemetery", note: "Across the Potomac: Changing of the Guard", lat: 38.878538, lng: -77.069112, kind: "area" as const },
  { id: "iwo-jima", name: "Marine Corps War Memorial (Iwo Jima)", note: "Arlington: overlooks DC", lat: 38.890474, lng: -77.069738, kind: "area" as const },
  { id: "rock-creek", name: "Rock Creek Park (Peirce Mill area)", note: "Trails and woods inside the city", lat: 38.9475, lng: -77.0527, kind: "area" as const },
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
