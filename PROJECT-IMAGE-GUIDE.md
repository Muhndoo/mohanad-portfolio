# Project ↔ Image Identification Guide
Source: Portfolio_for_website.pdf (35 pages, July 2026). This file is the single source
of truth for matching renders to projects. Check EVERY image against this before assigning.

## 01 — Soccer Training Center / "Fitness Engine Sports Company"
Warehouse renovation → soccer training facility. Tools: Revit, Lumion, 3ds Max.
VISUAL IDENTITY: "FITNESS ENGINE" blue soccer-ball logo appears on walls in renders.
Indoor turf field, VR room, upper-level café with balcony overlooking field, reception
with black/white angular desk, vending machines, epoxy floors.
- Before photos: gutted warehouse, exposed steel roof trusses, construction debris
- Site images: assets/fitness/* (renders, before photos, floorplan)
- RULE: if the Fitness Engine logo is visible anywhere in an image, it belongs to
  THIS project and no other.

## 02 — Residential Apartment
Newlyweds' first home. Living room, CLOSED kitchen, dining. Tiles, partition,
gypsum, wood. 3ds Max & V-Ray. Cozy contemporary.
- Site slot: "Family Residential Home" tile → assets/apartment.jpg (NOT YET UPLOADED)

## 03 — Residential Villa Design (renovation)
Newly married couple. Livingroom, mancave, master suite, walk-in closet, stairs
safety restructure. LVT flooring, wood, marble. Revit & 3ds Max.
- Site slot: "Residential Villa" tile → assets/villa.jpg (NOT YET UPLOADED)

## 04 — Residential Interior (Eastern Province)
Elevator-addition renovation. Luxury living room, coffee corner, cladding,
smart tech. 3ds Max & V-Ray. Not currently on site.

## 05 — Residential Villa (3-level, family with two children)
Modern facade, outdoor stair to basement, marble/glass/hidden light. Revit & Lumion.
Not currently on site as separate tile.

## 06 — Master Spa Bathroom (USA)
Steamboat Springs, Colorado. Country/modern spa-feel bathroom. Textured tile,
smart fixtures, heated flooring. AutoCAD & 3ds Max (Corona).
VISUAL IDENTITY: spa bathroom render — marble, freestanding tub, warm light,
NO branding/logos anywhere.
- Site image: assets/spa-bathroom.jpg ✓ (recovered from mislabeled upload)

## 07 — Paramount Showroom (Bahrain)
Freelance for Paramount Doors. Door display showroom, SKYLIGHT ceiling,
customer circulation loop, reception, offices, try-out area. LVT, vinyl fabric
wallpaper, wood, metal. Revit & Lumion.
- Site slot: More Work tile → image NOT YET UPLOADED
- RULE: look for door displays + skylight.

## 08 — IKEA Restaurant
Full restaurant makeover: zoning, seating, demolition/construction coordination,
procurement. Epoxy, metal ceiling, plants, IMS system. AutoCAD & Sketchup.
- Site slot: More Work tile → image NOT YET UPLOADED

## 09 — IKEA Sustainable Kitchen (+ Small Kitchen, Kids Room, Living Room)
Collaborative IKEA retail concepts.
- Site slot: More Work tile → image NOT YET UPLOADED

## 10 — Amount Café
Freelance café. VISUAL IDENTITY: the giant MIRROR shaped like the café's logo
(butterfly-like form) mounted on a wood-slat wall — this mirror IS the project's
signature. Terrazzo tables, glass pendant lights, epoxy/wood/MDF. AutoCAD & 3ds Max.
- Site image: assets/amount-cafe.jpg ✓ (was mislabeled "energy.jpg")
- RULE: logo-shaped mirror on slat wall = Amount Café, always.

## 11 — Ministry of Energy / Unreal Engine (Vertex School, MISK)
Unreal Engine bootcamp certification + 72-hr technical assessment framing.
Cinematic scenes, lighting, VR. Real-time renders, not Corona/V-Ray stills.
- Site slot: More Work tile → image NOT YET UPLOADED (needs UE screenshot)

## Unresolved
- assets/unidentified-kitchen.jpg — dark kitchen, black cabinets, dramatic marble
  backsplash, island with stools, warm under-cabinet lighting. Was mislabeled
  "cafe.jpg". Belongs to ONE of: Residential Villa Design kitchen, Residential
  Apartment closed kitchen, or an IKEA kitchen concept. AWAITING MOHANAD'S
  CONFIRMATION — do not assign until confirmed.

## Pre-push checklist (mandatory)
1. Every img path referenced in HTML resolves to a real file (run ref-check script)
2. Every image visually inspected and matched against this guide
3. No Fitness Engine branding in any non-Fitness tile
4. No duplicate image across different projects
