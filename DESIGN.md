# Commander Control UI

This redesign follows Impeccable's task-oriented design, accessibility, and responsive guidance. The product is a Commander tabletop companion: local tablet play, table configuration, shared TV display, saved games, players, and account management.

The visual direction is a quiet, warm game room. Charcoal and stone surfaces, parchment text, brass actions, and muted forest secondary controls support long sessions under low ambient light. Self-hosted Cormorant Garamond gives landing and workspace headings their editorial character; DM Sans keeps controls readable. Player card art and life totals remain the focus during play.

Navigation is shared across landing, management, setup, and explanatory routes. At narrow widths it becomes an explicitly labeled expandable menu. Tablet and TV gameplay keep compact device controls. Home makes local tablet play the primary action and explains tablet plus TV setup separately. Advanced variants use a native disclosure; local games remain available without an account. Signed-out management screens provide clear sign-in and local-play actions.

beUI provides the shared navigation hover background and spring button/link primitives. Aceternity provides the adapted Bento Grid for setup modes and feature explanations. Registry source and licenses are recorded in components/THIRD-PARTY-NOTICES.md. Components use local theme tokens rather than upstream default colors.

Use 12px panel corners, one border for normal panels, grouped spacing, and generous separation between tasks. Avoid continuous decorative animation and background grids. Motion is brief press feedback or navigation movement; honor reduced motion. Use tabular numerals for game data, meaningful accessible labels for every counter, visible focus, native form validation, and enabled browser zoom. Touch controls are at least 44px high. Phone gameplay scrolls instead of compressing player controls into a fixed-height viewport.

Visual acceptance covers desktop, portrait phone, landscape tablet, and TV-sized viewports. Live authentication, saved-game mutations, invitation delivery, and hardware/Safari acceptance require their own evidence.
