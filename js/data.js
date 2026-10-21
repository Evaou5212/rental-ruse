// ---------------------------------------------------------------------------
// Game content: scenes, hotspots, checklist items, decoys.
// All rects are [left%, top%, width%, height%] relative to the scene image.
// ---------------------------------------------------------------------------

export const IMG = "assets/img/";

export const SCENES = {
  room: {
    id: "room",
    name: "Main Room",
    icon: "🛋️",
    image: IMG + "room.jpg",
    ratio: 1536 / 1024,
    intro: "A bright Brooklyn studio. Looks perfect... but looks are cheap. Click anything you'd want to check.",
  },
  bathroom: {
    id: "bathroom",
    name: "Bathroom",
    icon: "🚿",
    image: IMG + "bathroom.jpg",
    ratio: 1536 / 1024,
    intro: "Freshly tiled bathroom. Four things in here deserve a real test.",
  },
};

export const CATEGORIES = {
  noise: { label: "Noise & Neighbors", color: "#7b5cc7" },
  windows: { label: "Windows", color: "#3a6faf" },
  water: { label: "Water & Plumbing", color: "#2a9d8f" },
  surfaces: { label: "Walls, Ceiling & Floors", color: "#b5651d" },
  climate: { label: "Heating & Cooling", color: "#e76f51" },
  electric: { label: "Electrical", color: "#e9a800" },
  doors: { label: "Doors & Security", color: "#5c5c5c" },
  appliances: { label: "Appliances", color: "#1f8a70" },
  storage: { label: "Storage", color: "#c2578b" },
  safety: { label: "Safety", color: "#d62828" },
  connectivity: { label: "Connectivity", color: "#2b7de9" },
  layout: { label: "Layout & Size", color: "#6b8e23" },
};

// Areas are used by the soft hint system ("Still 3 things to check in the kitchen").
export const AREAS = {
  kitchen: { label: "kitchen", scene: "room" },
  living: { label: "living area", scene: "room" },
  sleep: { label: "sleeping nook", scene: "room" },
  up: { label: "ceiling", scene: "room" },
  bath: { label: "bathroom", scene: "bathroom" },
  pocket: { label: "your own pockets", scene: null },
};

// ---------------------------------------------------------------------------
// Checklist items. Each item is collected once all of its steps are completed.
// step.image  -> full detail image
// step.crop   -> [l, t, w, h] crop of the current scene image (zoom-in effect)
// step.overlay-> optional animated overlay ("water", "drain", "missing", "tape", "steam", "flush")
// step.action -> label of the button that advances to the next step
// ---------------------------------------------------------------------------
export const ITEMS = {
  // ----- Noise -------------------------------------------------------------
  listen: {
    title: "Soundproofing",
    category: "noise",
    area: "pocket",
    icon: "👂",
    riddle: "Stop clicking for a moment and just... use something in your pocket.",
    why: "Noise is the #1 regret renters report after moving in, and it's the one thing you can't fix with a trip to the hardware store.",
    steps: [
      {
        tool: "listen",
        caption: "Stand still in the middle of the room and listen for a full 30 seconds.",
        action: "Listen quietly",
      },
    ],
    tips: [
      "Listen twice: once with the windows closed, once with them open.",
      "Stand next to each shared wall and the hallway door. Knock on the walls — a hollow sound means thin drywall.",
      "Ask what is directly above, below and next to this unit (another apartment? roof? a bar?).",
      "Ask where the elevator, trash chute / trash room, boiler room and laundry room are relative to this unit. Being next to any of them is a daily annoyance.",
      "If you can, revisit on a weekday evening or weekend — a quiet Tuesday at 11am tells you nothing.",
    ],
    redFlags: [
      "You can hear a conversation through the wall.",
      "Unit shares a wall with the elevator shaft, trash room or mechanical room.",
      "Ground floor facing a bar, restaurant exhaust or bus stop.",
    ],
    ask: "“Who lives above and next door? Where are the elevator and trash rooms on this floor?”",
    takeaway: "Listen with windows open & closed; locate elevator / trash / boiler room.",
  },

  // ----- Windows -----------------------------------------------------------
  window_open: {
    title: "Window Operation",
    category: "windows",
    area: "living",
    icon: "🪟",
    riddle: "Something with wooden slats that hasn't been opened in a while.",
    why: "A window that won't open is a ventilation and fire-safety problem; one that won't lock is a security problem.",
    steps: [
      {
        image: IMG + "window_closed.jpg",
        caption: "Blinds down, window shut. Pretty — but does it actually work?",
        action: "Raise the blinds & open the window",
      },
      {
        image: IMG + "window_open.jpg",
        caption: "It slides... with some effort. Now check that it closes fully and latches.",
      },
    ],
    tips: [
      "Open and close EVERY window all the way, not just one.",
      "Does it stay open on its own, or slam shut? (Broken balance springs are common in older buildings.)",
      "Close it fully and check the latch / lock engages. Street-level and fire-escape windows must lock.",
      "Feel for drafts around the frame and look for condensation or fog between double panes (failed seal).",
      "Raise and lower the blinds — are they included, and do they work?",
    ],
    redFlags: [
      "Painted shut or needs real force to move.",
      "Latch missing or broken.",
      "Cold air pouring through the frame — expect high heating bills.",
    ],
    ask: "“Are the windows original? When were they last replaced?”",
    takeaway: "Open, close and lock every window.",
  },

  window_view: {
    title: "Orientation & View",
    category: "windows",
    area: "living",
    icon: "🧭",
    riddle: "Once the window is open, look OUT of it — what's facing you?",
    why: "Direction decides your daylight; what's outside decides your noise, privacy and whether you'll ever open the curtains.",
    steps: [
      {
        image: IMG + "window_open.jpg",
        caption: "The view: another building's brick wall, about ten feet away. A neighbor's window stares right back.",
      },
    ],
    tips: [
      "Use your phone compass. South-facing = bright all day. North-facing = soft, dim light. East = morning sun, West = hot afternoons.",
      "What is directly outside? Another building's wall means little daylight and zero privacy.",
      "Scan for noise sources: busy road, elevated train, highway, construction site, school yard, bar or restaurant exhaust fan.",
      "Is there a fire escape? Great for safety, but it's also an access point — the window must lock.",
      "Note the time of your visit and imagine the light at other hours.",
    ],
    redFlags: [
      "Brick wall or air shaft directly outside (“lot-line window”).",
      "Active construction site next door — months of noise and dust.",
      "Window directly facing a neighbor's window a few feet away.",
    ],
    ask: "“Which direction does the unit face? Is anything being built nearby?”",
    takeaway: "Check compass direction, daylight and what's outside the window.",
  },

  window_screen: {
    title: "Window Screens",
    category: "windows",
    area: "living",
    icon: "🦟",
    riddle: "Look closer at the open window — there's a mesh with a problem.",
    why: "No screen or a torn one = mosquitoes, flies and in NYC, possibly pigeons and roaches walking right in.",
    steps: [
      {
        image: IMG + "window_screen.jpg",
        caption: "Look at the lower-left of the mesh: a tear. That's an open door for every bug in Brooklyn.",
      },
    ],
    tips: [
      "Every window that opens should have a screen that fits snugly in its track.",
      "Run your hand over the mesh — look for holes, tears and bent frames.",
      "Ask whether the landlord replaces screens or expects you to.",
      "If children under 10 will live here, NYC requires window guards — ask about them.",
    ],
    redFlags: [
      "Missing screens on a ground-floor or fire-escape window.",
      "Torn mesh (pictured above).",
    ],
    ask: "“Will damaged screens be replaced before move-in?”",
    takeaway: "Every window needs an intact, well-fitting screen.",
  },

  // ----- Water -------------------------------------------------------------
  faucet: {
    title: "Faucet & Water Pressure",
    category: "water",
    area: "kitchen",
    icon: "🚰",
    riddle: "Shiny, silver, and arched over a basin. Turn it on.",
    why: "Weak pressure or slow hot water is a building-wide plumbing issue — the landlord cannot fix it for you after you sign.",
    steps: [
      {
        image: IMG + "sink.jpg",
        caption: "Nice faucet. Everyone looks at it, almost nobody turns it on.",
        action: "Turn on the tap",
      },
      {
        image: IMG + "sink.jpg",
        overlay: "water",
        caption: "Running. Now count: how many seconds until it's actually hot?",
      },
    ],
    tips: [
      "Run BOTH hot and cold. Time how long the hot water takes to arrive (over 60–90 seconds is a daily annoyance).",
      "Check the pressure: a strong steady stream, not a trickle. Then run the bathroom sink at the same time and see if it drops.",
      "Look at the water: cloudy or rusty-brown for more than a few seconds is a red flag.",
      "Feel the base of the faucet and the sprayer hose for leaks.",
      "Ask whether hot water and heat are included in rent (very common in NYC, but not guaranteed).",
    ],
    redFlags: [
      "Trickle-level pressure.",
      "Hot water takes several minutes or never gets truly hot.",
      "Brown or smelly water.",
    ],
    ask: "“Is hot water included? Is there a shared boiler, and when was it last serviced?”",
    takeaway: "Run hot & cold; time the hot water; check pressure.",
  },

  drain: {
    title: "Sink Drain Speed",
    category: "water",
    area: "kitchen",
    icon: "🌀",
    riddle: "Water goes in... but does it go out? Same spot as the faucet.",
    why: "A slow drain is a clog today and a flooded cabinet (or neighbor's ceiling) next month.",
    steps: [
      {
        image: IMG + "sink.jpg",
        overlay: "drain",
        caption: "Let a few inches collect, then pull the plug. Watch the water line.",
      },
    ],
    tips: [
      "Fill the sink partially, then let it drain. It should empty in seconds without gurgling.",
      "Listen for gurgling from OTHER fixtures — that means a vent or main line problem.",
      "If there's a garbage disposal, run it for a second (with water on).",
      "Repeat in the bathroom sink, shower and tub.",
    ],
    redFlags: [
      "Standing water that drains over a minute.",
      "Bubbles or gurgling noises.",
      "A fresh bottle of drain cleaner under the sink — someone is already fighting a clog.",
    ],
    ask: "“Have there been any plumbing or clog issues in this unit?”",
    takeaway: "Fill and drain every sink, tub and shower.",
  },

  undersink: {
    title: "Under the Sink",
    category: "water",
    area: "kitchen",
    icon: "🚪",
    riddle: "Two cream cabinet doors with brass handles. Open them.",
    why: "The cabinet under the sink is where leaks, mold and pests hide — and almost nobody opens it during a viewing.",
    steps: [
      {
        image: IMG + "cabinet_closed.jpg",
        caption: "Closed doors, clean counter. Everything a landlord wants you to see.",
        action: "Open the cabinet doors",
      },
      {
        image: IMG + "cabinet_open.jpg",
        caption: "Water stains on the floor of the cabinet and green mold climbing the back corner. This is why you open things.",
      },
    ],
    tips: [
      "Open every cabinet under every sink. Use your phone flashlight.",
      "Look for water rings, warped or swollen wood, and dampness at the pipe joints (the P-trap).",
      "Smell it: musty = past or present leak.",
      "Look for pest evidence: droppings, roach traps, bait stations, gnawed boxes.",
      "A single spot that's suspiciously cleaner or freshly painted may be hiding damage.",
    ],
    redFlags: [
      "Active drip, black or green mold (pictured), swollen particleboard.",
      "Roach bait traps or mouse droppings.",
    ],
    ask: "“When was the last leak here, and how was it repaired?”",
    takeaway: "Open under-sink cabinets: stains, mold, drips, pests.",
  },

  // ----- Surfaces ----------------------------------------------------------
  walls: {
    title: "Walls, Ceiling & Frames",
    category: "surfaces",
    area: "living",
    icon: "🖼️",
    riddle: "Pretty artwork on a mint-green wall. What's around it (and behind it)?",
    why: "Water damage and mold show up on walls and ceilings first — and a fresh coat of paint hides them for exactly one season.",
    steps: [
      {
        crop: [67, 12, 15, 20],
        caption: "Don't just look at the art. Look at the wall around it, the ceiling line, and the window frame.",
      },
    ],
    tips: [
      "Look at every ceiling corner and along the top of exterior walls for yellow/brown water rings.",
      "Check for bubbling or peeling paint, especially under windows and around the AC unit.",
      "Press gently on suspicious spots — soft drywall means moisture.",
      "Look behind art and furniture if you can; stains get covered up before viewings.",
      "Window frames and sills: rot, black mold, peeling paint.",
      "A patch of paint that doesn't quite match the rest of the wall = a recent repair. Ask about it.",
      "Take photos of every existing mark before move-in so you don't lose your deposit over it.",
    ],
    redFlags: [
      "Bubbling paint under a window or near the ceiling.",
      "Dark spots in corners, musty smell.",
      "Hairline cracks are usually fine; cracks wider than a coin are not.",
    ],
    ask: "“Has this unit ever had a leak or water damage? When was it last painted, and why?”",
    takeaway: "Check corners, ceilings and frames for stains, bubbling, mold, mismatched paint.",
  },

  rug: {
    title: "Floors & Rugs",
    category: "surfaces",
    area: "living",
    icon: "🧶",
    riddle: "A colorful geometric rug. Lovely. Now lift the corner.",
    why: "Rugs and furniture are placed to hide things. Floors are expensive to repair, so damage gets covered, not fixed.",
    steps: [
      {
        image: IMG + "rug_flat.jpg",
        caption: "Lift the corner. A dark stain on the floor underneath — past flood? Pet? Either way: not yours to pay for.",
      },
    ],
    tips: [
      "Lift every rug corner and peek under furniture if you can.",
      "Walk the whole floor: squeaks, soft spots, boards that lift, gaps between planks.",
      "Drop a marble or use a phone level — badly sloped floors mean structural settling.",
      "Carpet: smell it (pets, smoke), check for stains and worn patches.",
      "Photograph every scratch and stain — this protects your deposit.",
    ],
    redFlags: [
      "Stain hidden under a rug (pictured) — ask what happened.",
      "Warped or buckled boards = water came through here.",
    ],
    ask: "“What's under the rug? Will the floors be refinished before move-in?”",
    takeaway: "Lift rugs, walk the floor, photograph existing damage.",
  },

  // ----- Climate -----------------------------------------------------------
  ac: {
    title: "AC / Heating",
    category: "climate",
    area: "living",
    icon: "❄️",
    riddle: "A white box mounted way up high, above the window. Does it actually work?",
    why: "A dead or dripping AC in July — or a radiator the landlord controls in January — will define your year here.",
    steps: [
      {
        image: IMG + "ac_off.jpg",
        caption: "Red standby light. The agent says “yeah it works great.” Find out.",
        action: "Turn it on",
      },
      {
        image: IMG + "ac_on.jpg",
        overlay: "steam",
        caption: "It runs and blows cold — but look at the bottom-right corner: it's dripping. That water ends up on the floor or inside the wall.",
      },
    ],
    tips: [
      "Actually turn it on (ask for the remote). Wait 2–3 minutes for cold (or hot) air.",
      "Listen: a steady hum is fine; rattling, clicking or grinding is not.",
      "Look for drips below the unit and water stains on the wall under it.",
      "Smell the first air that comes out — musty means a moldy filter or coil.",
      "Ask what the HEAT source is (radiator, baseboard, central, heat pump) and who controls the thermostat.",
      "Ask who pays for heat, hot water, gas and electric. Get it in the lease.",
    ],
    redFlags: [
      "Dripping indoors (pictured).",
      "Loud rattling, or takes forever to cool.",
      "Heat is building-controlled with a history of “it's a bit cold in winter” comments.",
    ],
    ask: "“Who pays for heat and AC? How is the apartment heated, and who controls it?”",
    takeaway: "Turn the AC/heat on, listen, check for drips; ask who pays.",
  },

  // ----- Electrical ----------------------------------------------------------
  outlets: {
    title: "Outlets & Switches",
    category: "electric",
    area: "living",
    icon: "🔌",
    riddle: "Tiny, white, rectangular, and easy to miss on the wall between the fridge and the bathroom.",
    why: "Older NYC buildings often have 2–3 outlets per room. Extension cords everywhere is how you end up unhappy (and how fires start).",
    steps: [
      {
        crop: [34, 26, 10, 14],
        caption: "One outlet on this whole wall. Count them for every room and picture where your bed, desk and TV go.",
      },
    ],
    tips: [
      "Count outlets per wall. Are there any near the bed, the desk spot, and the kitchen counter?",
      "Bring a phone charger and test a few outlets — dead ones are common.",
      "Three-prong grounded outlets everywhere? Two-prong = old wiring.",
      "GFCI outlets (with the test/reset buttons) are required near sinks.",
      "Look for scorch marks, loose faceplates, or outlets that feel warm.",
      "Flip every light switch. Ask where the breaker panel is — if it's in the basement, you need the super for every tripped breaker.",
      "Running an AC + microwave + hair dryer at once? Ask about the amperage.",
    ],
    redFlags: [
      "Two-prong outlets only.",
      "Scorch marks, buzzing, or a breaker panel with fuses.",
      "Extension cords stapled along the baseboards.",
    ],
    ask: "“Where's the breaker panel? Has the wiring been updated?”",
    takeaway: "Count & test outlets; check for grounding and GFCI; find the breaker panel.",
  },

  // ----- Appliances ----------------------------------------------------------
  stove: {
    title: "Stove & Oven",
    category: "appliances",
    area: "kitchen",
    icon: "🔥",
    riddle: "Black, with four burners and a yellow kettle on top.",
    why: "A burner that won't light or an oven that won't heat is a repair ticket that takes weeks — test it in 60 seconds now.",
    steps: [
      {
        image: IMG + "stove.jpg",
        caption: "Turn every knob. Each burner should click and light within a couple of seconds. Then turn the oven on and listen for ignition.",
      },
    ],
    tips: [
      "Light all four burners. Gas: a blue, even flame. Electric: coils glow within a minute.",
      "Turn the oven to 350°F — you should hear/feel it ignite and warm within a few minutes.",
      "Smell for gas near the stove and the shut-off valve when everything is OFF.",
      "Turn on the range hood / exhaust fan. Does it vent outside or just blow back at you?",
      "Open the oven door and broiler drawer. Grease and crumbs invite roaches.",
      "Pull the stove away slightly if you can — look at the wall and floor behind it.",
    ],
    redFlags: [
      "Gas smell, yellow or sputtering flames.",
      "A burner that won't light.",
      "Hood fan that doesn't work (smoke alarms every time you cook).",
    ],
    ask: "“Is the stove gas or electric? Who pays for gas?”",
    takeaway: "Light every burner, test the oven and hood fan.",
  },

  fridge: {
    title: "Fridge, Dishwasher & Cabinets",
    category: "appliances",
    area: "kitchen",
    icon: "🧊",
    riddle: "Big, cream-colored, covered in flower magnets.",
    why: "A warm fridge, a moldy dishwasher or roach droppings in a drawer are all things you can only discover by opening them.",
    steps: [
      {
        crop: [20, 27, 20, 33],
        caption: "Open the fridge and freezer. Open the dishwasher. Then open every drawer and cabinet in the kitchen — all of them.",
      },
    ],
    tips: [
      "Fridge: is it running and cold? Close the door on a piece of paper — if it slides out easily, the seal is shot.",
      "Smell inside the fridge and freezer. Check for ice buildup and mold on the gasket.",
      "Dishwasher: open it, look for standing water at the bottom, smell it. Ask if you can run a quick rinse cycle.",
      "Open every cabinet and drawer: pest droppings, bait traps, water damage, broken hinges.",
      "Microwave: run it for 10 seconds with a cup of water.",
      "Ask which appliances are included and what happens when one breaks (who fixes, how fast).",
    ],
    redFlags: [
      "Fridge that's warm or very loud.",
      "Standing water or black mold in the dishwasher.",
      "Any droppings — once is a pattern.",
    ],
    ask: "“Which appliances are included, and who repairs them?”",
    takeaway: "Open and test fridge, dishwasher, microwave, every drawer and cabinet.",
  },

  laundry: {
    title: "Washer / Dryer",
    category: "appliances",
    area: "sleep",
    icon: "🧺",
    riddle: "Stacked, silver, with two round doors — behind an open white door.",
    why: "In-unit laundry is a huge perk — unless the dryer has no vent or the washer gasket is a mold farm.",
    steps: [
      {
        crop: [50, 22, 18, 40],
        caption: "In-unit, stacked washer and dryer. Open both doors — don't just admire them.",
      },
    ],
    tips: [
      "Open the washer: smell it and check the rubber gasket for black mold.",
      "Ask to run a quick spin cycle — does it shake violently or leak?",
      "Dryer: where does it vent? A dryer with no external vent dumps lint and humidity into the apartment.",
      "Check the lint trap and the hose connections behind if visible.",
      "If laundry is in the building instead: where, how many machines, cost per load, hours?",
    ],
    redFlags: [
      "Musty smell / black gasket.",
      "No visible dryer vent.",
      "Water stains on the floor around the unit.",
    ],
    ask: "“Is the washer/dryer included and maintained by the landlord? Where does the dryer vent?”",
    takeaway: "Open both machines, check the gasket, find the dryer vent.",
  },

  // ----- Storage -------------------------------------------------------------
  closet: {
    title: "Closets & Storage",
    category: "storage",
    area: "sleep",
    icon: "👚",
    riddle: "Behind an orange curtain, next to the bed: clothes on hangers.",
    why: "Studios live or die by storage. A closet that's too shallow or smells of mold will annoy you every single morning.",
    steps: [
      {
        crop: [74, 8, 22, 50],
        caption: "The closet behind the curtain. Open every door, pull the curtain all the way back, and look UP inside it.",
      },
    ],
    tips: [
      "Open every closet, cabinet and built-in. Measure depth — can a hanger fit without touching the wall?",
      "Tug the rod and shelves. Loose rods come down with winter coats.",
      "Smell: musty or mothballs means moisture or a past pest problem.",
      "Look at the closet ceiling and back wall for water stains (closets share walls with bathrooms and pipes).",
      "Count total storage honestly against what you own. Ask about building storage or bike rooms.",
    ],
    redFlags: [
      "Musty smell or stains inside.",
      "Sagging rod, no door, or so shallow hangers sit sideways.",
    ],
    ask: "“Is there any additional storage in the building?”",
    takeaway: "Open every closet; check depth, smell, rod and ceiling.",
  },

  // ----- Safety --------------------------------------------------------------
  detector: {
    title: "Smoke & CO Detectors",
    category: "safety",
    area: "up",
    icon: "🚨",
    riddle: "Look UP. Something that should be on the ceiling... isn't.",
    why: "Smoke and carbon monoxide detectors are required by law and they save lives. Removed or dead ones are shockingly common in rentals.",
    steps: [
      {
        crop: [30, 0, 40, 20],
        overlay: "missing",
        caption: "Scan the whole ceiling. No smoke detector. No CO detector. Not even a disconnected one — and this unit has a gas stove.",
      },
    ],
    tips: [
      "Locate a smoke detector and a carbon monoxide detector (or a combo unit). NYC requires both, and the CO detector must be near sleeping areas.",
      "Press the TEST button. It should chirp loudly. If nothing happens, the battery is dead or the unit is disconnected.",
      "Check the date on the back/side — detectors expire after 10 years.",
      "A dangling unit with no battery is a red flag about how the landlord handles maintenance in general.",
      "Also note: fire extinguisher? Sprinklers? Clear path to a second exit (fire escape or second stairwell)?",
    ],
    redFlags: [
      "No detectors at all (like this room).",
      "Detector with the battery removed.",
      "Gas stove + no CO detector.",
    ],
    ask: "“Will working smoke and CO detectors be installed before move-in? Can that be written into the lease?”",
    takeaway: "Find & test smoke and CO detectors; demand they're installed before move-in.",
  },

  // ----- Connectivity --------------------------------------------------------
  phone: {
    title: "Cell Signal & Internet",
    category: "connectivity",
    area: "pocket",
    icon: "📶",
    riddle: "The most important item on this checklist is already in your pocket.",
    why: "Brick buildings and courtyard-facing units can be dead zones. Everyone forgets to check until the first dropped call.",
    steps: [
      {
        tool: "phone",
        caption: "Take out your phone and check the bars — in every corner of the apartment.",
        action: "Check signal",
      },
    ],
    tips: [
      "Check your bars in every room, in the bathroom, and lying on the bed spot. Make an actual call.",
      "Different carriers behave differently in the same building — if you're moving in with someone, both of you should check.",
      "Ask which internet providers serve the building (in NYC it's often only ONE option). Look for existing cable/fiber jacks.",
      "Ask neighbors or the super about internet reliability if you work from home.",
    ],
    redFlags: [
      "One bar or “SOS” indoors.",
      "Only a single internet provider with a bad reputation.",
    ],
    ask: "“Which internet providers are available in the building?”",
    takeaway: "Check signal in every room; ask about internet providers.",
  },

  // ----- Layout --------------------------------------------------------------
  dimensions: {
    title: "Room Dimensions",
    category: "layout",
    area: "sleep",
    icon: "📏",
    riddle: "Blue and white polka dots. If you like this place, measure it.",
    why: "“A queen fits” is not the same as “a queen fits and you can still open the closet.” Measure now, not after the lease is signed.",
    steps: [
      {
        crop: [64, 32, 26, 28],
        overlay: "tape",
        caption: "Measure where your bed, desk and sofa would go. Note where the windows, radiator and outlets are — they decide the layout for you.",
      },
    ],
    tips: [
      "Bring a tape measure (or use your phone's Measure app). Measure wall lengths and the spots where big furniture goes.",
      "Measure the front door, hallway and stairwell/elevator — your sofa has to get IN.",
      "Note ceiling height, window positions and radiator positions on a quick sketch.",
      "Ask for a floor plan with dimensions. Listing square footage is often optimistic.",
      "Take a video walkthrough so you can re-check details later without another visit.",
    ],
    redFlags: [
      "Bed fits but blocks the closet or the window.",
      "Narrow stairwell with no elevator (ask how previous tenants moved furniture).",
    ],
    ask: "“Do you have a floor plan with measurements? How do people usually move large furniture in?”",
    takeaway: "Measure the room, doorways and stairs; take a video.",
  },

  // ----- Bathroom ------------------------------------------------------------
  shower: {
    title: "Shower Pressure & Hot Water",
    category: "water",
    area: "bath",
    icon: "🚿",
    riddle: "Glass box, brass rain head. Turn it on and wait.",
    why: "Showers are where bad water pressure hurts most. You'll feel this every single morning for a year.",
    steps: [
      {
        crop: [8, 0, 44, 78],
        caption: "Turn the shower on full and let it run for a solid minute. Yes, really — even in your shoes.",
        action: "Run the shower",
      },
      {
        crop: [8, 0, 44, 78],
        overlay: "shower",
        caption: "Count the seconds until it's hot. Watch the pressure. Then look at the floor: is it draining as fast as it fills?",
      },
    ],
    tips: [
      "Run the shower for at least a minute. Time how long until it's hot, and whether it stays hot.",
      "Check pressure with the bathroom sink running at the same time.",
      "Watch the drain — water should never pool around your feet.",
      "Check the shower door/curtain seal and the caulk around the base for black mold.",
      "Is the shower head high enough for the tallest person moving in?",
    ],
    redFlags: [
      "Weak pressure or temperature that swings.",
      "Pooling water, black caulk, soft/cracked grout.",
    ],
    ask: "“Is there a shared hot water tank? Any complaints about pressure in the morning?”",
    takeaway: "Run the shower for a minute: heat, pressure, drainage.",
  },

  toilet: {
    title: "Toilet",
    category: "water",
    area: "bath",
    icon: "🚽",
    riddle: "Porcelain throne, bottom-left of the bathroom. Flush it.",
    why: "A running or wobbly toilet is a leak waiting to happen — and your downstairs neighbor's ceiling.",
    steps: [
      {
        crop: [4, 54, 36, 46],
        caption: "Flush it once. Then wait two full minutes and listen.",
        action: "Flush",
      },
      {
        crop: [4, 54, 36, 46],
        overlay: "flush",
        caption: "Strong flush, refills in under a minute, then... silence. That's what you want. A hiss or trickle after 2 minutes is a running toilet.",
      },
    ],
    tips: [
      "Flush and watch: strong flush, refills within about a minute, then completely silent.",
      "Listen after two minutes — hissing or trickling means a running toilet (wasted water, and usually a sign of neglected maintenance).",
      "Push the bowl gently: it should not rock. Look at the base for stains or soft flooring.",
      "Check the seat and lid are secure and the tank lid isn't cracked.",
    ],
    redFlags: [
      "Wobble at the base, water or discoloration around the base.",
      "Continuous running / phantom flushes.",
    ],
    ask: "“Has the toilet or any bathroom plumbing been replaced recently?”",
    takeaway: "Flush, wait two minutes, listen; check for wobble at the base.",
  },

  bath_drain: {
    title: "Bathroom Sink & Ventilation",
    category: "water",
    area: "bath",
    icon: "🪞",
    riddle: "A small white sink under an oval mirror.",
    why: "Bathrooms without ventilation grow mold; sinks that drain slowly flood vanities. Both are cheap to check, expensive to live with.",
    steps: [
      {
        crop: [52, 44, 22, 26],
        caption: "Fill the sink, pull the stopper, time it. Then look up: is there an exhaust fan or a window? This one has neither.",
      },
    ],
    tips: [
      "Fill and drain the sink. Does the stopper actually hold water, and does it drain in seconds?",
      "Open the vanity or look under the sink — same checks as the kitchen: stains, drips, mold.",
      "Find the ventilation: an exhaust fan (turn it on, hold a tissue to it) or a window that opens. No vent = mold.",
      "Check the caulk around the sink and the grout lines for black spots.",
      "Is there a medicine cabinet or any storage? Where do your towels go?",
    ],
    redFlags: [
      "No fan AND no window.",
      "Slow drain or a stopper that doesn't seal.",
      "Black mold in grout or caulk lines.",
    ],
    ask: "“How is the bathroom ventilated?”",
    takeaway: "Fill & drain the sink; make sure there's a working fan or window.",
  },

  door: {
    title: "Doors & Locks",
    category: "doors",
    area: "bath",
    icon: "🔐",
    riddle: "Cream-colored, with a brass knob, on the far right of the bathroom.",
    why: "Doors that don't latch, locks that don't lock and hinges that scream — small things that become big things when you live with them.",
    steps: [
      {
        crop: [68, 22, 32, 56],
        caption: "Close the door. Does it latch? Does the lock work? Open it again — did it squeak loudly enough to wake someone?",
      },
    ],
    tips: [
      "Open and close EVERY door, including closets. Each should latch smoothly without slamming or sticking.",
      "Bathroom and bedroom doors: does the privacy lock work?",
      "Listen for squeaky hinges — minor, but it tells you about maintenance.",
      "Look at the gap under the door: large gaps leak sound, light and bugs.",
      "FRONT DOOR: deadbolt + chain/peephole, solid core, closes firmly in the frame. Test the building intercom/buzzer too.",
      "Ask who else has keys (super, landlord, previous tenants?) and whether locks are changed between tenants.",
    ],
    redFlags: [
      "Front door without a deadbolt.",
      "Door that won't close in its frame (building has shifted).",
      "Locks not changed since the last tenant.",
    ],
    ask: "“Are the locks changed between tenants? Who has keys to the unit?”",
    takeaway: "Open/close/lock every door; check the front door deadbolt and intercom.",
  },
};

// ---------------------------------------------------------------------------
// Hotspots: clickable regions in each scene. A hotspot can hold several items
// which are discovered in order (e.g. the window: open -> view -> screen).
// ---------------------------------------------------------------------------
export const HOTSPOTS = [
  // ----- Main room -----
  { id: "hs_ac", scene: "room", items: ["ac"], rects: [[81.5, 2, 12, 10]] },
  { id: "hs_window", scene: "room", items: ["window_open", "window_view", "window_screen"], rects: [[92.3, 11, 7.7, 41]] },
  { id: "hs_closet", scene: "room", items: ["closet"], rects: [[83, 13, 9.3, 42]] },
  { id: "hs_walls", scene: "room", items: ["walls"], rects: [[68.5, 13.5, 12.5, 16]] },
  { id: "hs_bed", scene: "room", items: ["dimensions"], rects: [[67.5, 36, 18.5, 18]] },
  { id: "hs_laundry", scene: "room", items: ["laundry"], rects: [[56, 27, 8, 32]] },
  { id: "hs_outlets", scene: "room", items: ["outlets"], rects: [[37.5, 31, 4, 7], [89.8, 31, 2.5, 5.5]] },
  { id: "hs_fridge", scene: "room", items: ["fridge"], rects: [[25.5, 30, 12, 29], [13, 53, 7, 25]] },
  { id: "hs_sink", scene: "room", items: ["faucet", "drain"], rects: [[10, 36, 14.5, 17]] },
  { id: "hs_undersink", scene: "room", items: ["undersink"], rects: [[20, 52, 7.5, 20]] },
  { id: "hs_stove", scene: "room", items: ["stove"], rects: [[0, 53, 12.5, 40]] },
  { id: "hs_rug", scene: "room", items: ["rug"], rects: [[48, 70, 26, 30]] },
  { id: "hs_ceiling", scene: "room", items: ["detector"], rects: [[36, 0, 44, 10]] },
  // Door into the bathroom: not an item, switches scene.
  { id: "hs_bathdoor", scene: "room", goto: "bathroom", rects: [[41.5, 11, 11, 50]] },

  // ----- Bathroom -----
  // Shower first so the toilet (appended later) wins where they overlap.
  { id: "hs_shower", scene: "bathroom", items: ["shower"], rects: [[18, 2.5, 28, 73]] },
  { id: "hs_toilet", scene: "bathroom", items: ["toilet"], rects: [[8, 56, 16, 17], [8, 70, 30, 30]] },
  { id: "hs_bathsink", scene: "bathroom", items: ["bath_drain"], rects: [[54, 46, 17, 22]] },
  { id: "hs_door", scene: "bathroom", items: ["door"], rects: [[87, 0, 13, 100]] },
];

// Decoys: fun, clickable, but not on the checklist.
export const DECOYS = [
  { scene: "room", rects: [[73, 52, 27, 48]], text: "Comfy sofa. Sit on it if you like — but furniture usually leaves with the current tenant." },
  { scene: "room", rects: [[28, 51, 21, 36]], text: "Cute dining set. Not on the checklist. Look at the room, not the staging." },
  { scene: "room", rects: [[27.5, 0, 8.5, 16]], text: "Pendant light works. Who pays the electric bill, though? (Hint: it's in the AC card.)" },
  { scene: "room", rects: [[0, 0, 14, 20]], text: "Nice plants. They'll be gone on move-in day. The water stain behind them won't." },
  { scene: "room", rects: [[14, 3, 12, 10]], text: "Books on a shelf. Pretty, but open shelving isn't a storage plan — find the closet." },
  { scene: "bathroom", rects: [[57, 16, 14, 30]], text: "Looking good! Now stop admiring yourself and test the plumbing." },
  { scene: "bathroom", rects: [[72, 40, 12, 40]], text: "A fluffy pink towel on a rack. Staging. Move on." },
  { scene: "bathroom", rects: [[58, 0, 12, 16]], text: "Pretty light. Flip the switch to be sure it works — then find the exhaust fan (spoiler: there isn't one)." },
];

export const RANKS = [
  { min: 0, tier: "C", title: "Rookie Renter", blurb: "You found everything — eventually. Next time, open the cabinets first." },
  { min: 1600, tier: "B", title: "Careful Tenant", blurb: "Solid instincts. You'd catch the big stuff before signing." },
  { min: 2100, tier: "A", title: "Lease Detective", blurb: "Thorough, fast, and not easily distracted by cute rugs." },
  { min: 2500, tier: "S", title: "Master Inspector", blurb: "Landlords fear you. Your deposit is safe forever." },
];

export const SCORING = {
  find: 100,
  streakBonus: 25, // found within STREAK_WINDOW_MS of the previous one
  streakWindowMs: 25000,
  hintCost: 40,
  revealCost: 150,
  timeBonusMax: 300, // full bonus when finishing under timeBonusUnderMs
  timeBonusUnderMs: 6 * 60 * 1000,
  timeBonusZeroMs: 20 * 60 * 1000,
};

export const HINT_TIMING = {
  softAfterMs: 20000, // nudge toast
  markerAfterMs: 40000, // pulsing marker on an undiscovered hotspot
  repeatEveryMs: 30000,
  manualCooldownMs: 8000,
  revealUnlockAfterMarkers: 2,
};
