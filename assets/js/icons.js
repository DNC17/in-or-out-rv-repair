/* Shared SVG sprite for product line art — injected instead of being
   duplicated in every page's markup. Loaded from inside <body>, so
   document.body already exists when this runs. */
document.body.insertAdjacentHTML('afterbegin',
  '<svg class="sprite" aria-hidden="true" width="0" height="0"><defs>' +
  "<g id=\"ic-furnace\"><rect x=\"8\" y=\"7\" width=\"32\" height=\"34\" rx=\"3\"/><path d=\"M14 14h20M14 20h20\"/><path d=\"M17 27c0 3 2 4 2 6M24 27c0 3 2 4 2 6M31 27c0 3 2 4 2 6\"/></g>" +
  "<g id=\"ic-heater\"><rect x=\"11\" y=\"6\" width=\"26\" height=\"36\" rx=\"13\"/><path d=\"M18 15h12M24 24v9\"/><circle cx=\"24\" cy=\"33\" r=\"3\"/></g>" +
  "<g id=\"ic-rod\"><path d=\"M24 6v30\"/><rect x=\"19\" y=\"36\" width=\"10\" height=\"6\" rx=\"1.5\"/><path d=\"M20 12h8M20 18h8M20 24h8\"/></g>" +
  "<g id=\"ic-faucet\"><path d=\"M10 38h28\"/><path d=\"M14 38V26h8v-6a10 10 0 0 1 16 8v4\"/><path d=\"M22 20h-8\"/><circle cx=\"18\" cy=\"14\" r=\"3\"/></g>" +
  "<g id=\"ic-faucet2\"><path d=\"M10 38h28\"/><path d=\"M24 38V20\"/><path d=\"M24 20c0-5 4-8 8-8\"/><path d=\"M12 16h8M28 16h8M16 12v8M32 12v8\"/></g>" +
  "<g id=\"ic-valve\"><circle cx=\"24\" cy=\"24\" r=\"9\"/><path d=\"M24 6v9M24 33v9M6 24h9M33 24h9\"/><circle cx=\"24\" cy=\"24\" r=\"3\"/></g>" +
  "<g id=\"ic-pump\"><rect x=\"9\" y=\"16\" width=\"22\" height=\"18\" rx=\"3\"/><path d=\"M31 22h8v6h-8\"/><path d=\"M14 16v-5h9v5\"/><circle cx=\"20\" cy=\"25\" r=\"4\"/></g>" +
  "<g id=\"ic-toilet\"><path d=\"M12 10h9v8h-9z\"/><path d=\"M10 20h26v6a13 13 0 0 1-13 13 13 13 0 0 1-13-13z\"/><path d=\"M21 14h15v6\"/></g>" +
  "<g id=\"ic-light\"><path d=\"M24 8v4\"/><path d=\"M9 30a15 15 0 0 1 30 0z\"/><path d=\"M14 36h20\"/><path d=\"M12 15l3 3M36 15l-3 3\"/></g>" +
  "<g id=\"ic-converter\"><rect x=\"6\" y=\"14\" width=\"36\" height=\"20\" rx=\"3\"/><path d=\"M13 20l-4 4 4 4M35 20l4 4-4 4\"/><path d=\"M20 26h8M24 22v8\"/></g>" +
  "<g id=\"ic-vent\"><rect x=\"8\" y=\"8\" width=\"32\" height=\"32\" rx=\"3\"/><circle cx=\"24\" cy=\"24\" r=\"9\"/><path d=\"M24 15v18M15 24h18\"/></g>" +
  "<g id=\"ic-jack\"><path d=\"M24 6v10\"/><rect x=\"18\" y=\"16\" width=\"12\" height=\"16\" rx=\"2\"/><path d=\"M24 32v6\"/><path d=\"M14 42h20\"/><path d=\"M18 22h12\"/></g>" +
  "<g id=\"ic-sealant\"><path d=\"M18 10h12v28H18z\"/><path d=\"M24 10V6\"/><path d=\"M24 38l-4 6h8z\"/><path d=\"M18 18h12\"/></g>" +
  "<g id=\"ic-lock\"><rect x=\"10\" y=\"20\" width=\"28\" height=\"20\" rx=\"3\"/><path d=\"M17 20v-5a7 7 0 0 1 14 0v5\"/><circle cx=\"24\" cy=\"29\" r=\"3\"/><path d=\"M24 32v4\"/></g>" +
  "<g id=\"ic-ac\"><rect x=\"5\" y=\"18\" width=\"38\" height=\"15\" rx=\"4\"/><path d=\"M12 18v-4h24v4\"/><path d=\"M12 24h24M12 28h24\"/><path d=\"M9 33v4M39 33v4\"/></g>" +
  "<g id=\"ic-shroud\"><path d=\"M9 33c0-9 6-15 15-15s15 6 15 15z\"/><path d=\"M5 37h38\"/><path d=\"M18 20l-3 13M30 20l3 13\"/></g>" +
  "<g id=\"ic-capacitor\"><rect x=\"16\" y=\"13\" width=\"16\" height=\"26\" rx=\"3\"/><path d=\"M21 13V8M27 13V8\"/><path d=\"M20 22h8M24 18v8\"/></g>" +
  "<g id=\"ic-grille\"><rect x=\"7\" y=\"11\" width=\"34\" height=\"26\" rx=\"3\"/><path d=\"M13 18h22M13 24h22M13 30h22\"/></g>" +
  "<g id=\"ic-fridge\"><rect x=\"13\" y=\"5\" width=\"22\" height=\"38\" rx=\"3\"/><path d=\"M13 19h22\"/><path d=\"M19 12v4M19 24v5\"/></g>" +
  "<g id=\"ic-coil\"><path d=\"M11 11h20a5 5 0 0 1 0 10H17a5 5 0 0 0 0 10h20\"/><path d=\"M11 7v4M37 31v4\"/><path d=\"M15 37h18\"/></g>" +
  "<g id=\"ic-board\"><rect x=\"7\" y=\"12\" width=\"34\" height=\"24\" rx=\"3\"/><circle cx=\"16\" cy=\"21\" r=\"2.5\"/><path d=\"M24 19h10M24 25h10M16 27v5\"/></g>" +
  "<g id=\"ic-switch\"><rect x=\"7\" y=\"21\" width=\"19\" height=\"12\" rx=\"2\"/><path d=\"M26 27h12\"/><path d=\"M13 21v-6l13-5\"/></g>" +
  "<g id=\"ic-blower\"><circle cx=\"21\" cy=\"24\" r=\"13\"/><path d=\"M21 24c0-6 3-9 8-8-2 5-5 8-8 8z\"/><path d=\"M21 24c-6 0-9-3-8-8 5 2 8 5 8 8z\"/><path d=\"M21 24c0 6-3 9-8 8 2-5 5-8 8-8z\"/><path d=\"M34 20h8v8h-8\"/></g>" +
  "<g id=\"ic-thermostat\"><rect x=\"12\" y=\"9\" width=\"24\" height=\"30\" rx=\"4\"/><circle cx=\"24\" cy=\"21\" r=\"7\"/><path d=\"M24 21v-4\"/><path d=\"M18 33h12\"/></g>" +
  "<g id=\"ic-lid\"><path d=\"M10 30a14 9 0 0 1 28 0z\"/><path d=\"M6 34h36\"/><path d=\"M11 30v5M37 30v5\"/></g>" +
  "<g id=\"ic-ring\"><rect x=\"7\" y=\"7\" width=\"34\" height=\"34\" rx=\"4\"/><rect x=\"16\" y=\"16\" width=\"16\" height=\"16\" rx=\"2\"/></g>" +
  '</defs></svg>');
