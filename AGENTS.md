# Checkpoint: Vietnam Map Customization Tool

## Project Context
This application is a professional map tool designed for journalists/editors to mark routes, select administrative regions, and export customized maps.

## Key Features & Logic
1. **Administrative Boundaries (Vietnam)**
   - Supports selecting and coloring Provinces (Tỉnh/Thành phố) and Communes (Xã/Phường/Thị trấn).
   - Logic: Uses MapLibre GL to render GeoJSON boundaries.
   - Interaction: Controlled via a "Selection Mode" (Pick) toggle in the sidebar.

2. **Mobile Interaction Patterns**
   - **Unified Interaction Handler**: Uses `touchend` and `click` to handle cross-platform selection.
   - **Selection Mode Toggle**: To prevent accidental triggers during map navigation (pan/zoom), selecting regions is only active when `isSelectionMode` is enabled.
   - **Auto-Hide UI**: On mobile, clicking "OK" in the Data Panel after coloring a region automatically hides the panel to focus back on the map.

3. **Technical Implementations**
   - **Ref Synchronization**: State variables like `isSelectionMode` are mirrored to `useRef` (e.g., `isSelectionModeRef`) so that global map event listeners always access the live value without requiring listener re-attachment.
   - **Hook Safety**: All `useRef` and `useState` declarations must be at the top level of the `MapInterface` component body to avoid "Invalid hook call" errors.
   - **Draw Controls**: Integrated with `@mapbox/mapbox-gl-draw` for line and polygon creation.

## State Management Checklist
- `selectedAdminUnits`: Array of selected regions.
- `adminUnitColors`: Map of IDs to hex colors.
- `adminUnitOpacities`: Map of IDs to opacity values.
- `isSelectionMode`: Boolean toggle for the interaction handler.

## Editorial Standards (Vietnamese)
- Follow standard Vietnamese orthography (e.g., "Bà mẹ Việt Nam Anh hùng").
- Prefer "bảo đảm" over "đảm bảo" (Editorial convention).
- Context: Serious political/journalistic tone.
