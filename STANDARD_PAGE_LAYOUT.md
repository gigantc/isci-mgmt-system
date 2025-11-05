# Standard Page Layout Pattern

This document defines the standard HTML/CSS structure for all pages in the ISCI Management System to ensure consistency and ease of maintenance.

## HTML Structure

All pages should follow this exact HTML structure:

```jsx
import Header from "@/containers/Header";
import styles from "./PageName.module.scss"; // or "./PageName/PageName.module.scss"

const PageName = () => {
  return (
    <div className={styles.pageName}>
      {/* Global Header - Always present */}
      <Header
        showAdminButton={true/false}
        showCreateButton={true/false}
        showBackButton={true/false}
      />

      {/* Main Page Content Area */}
      <div className={styles.pageContent}>

        {/* Sticky Header Section - Contains page title and optional controls */}
        <div className={styles.stickyHeader}>
          <h2>Page Title</h2>

          {/* Optional: Additional controls like search bar, add button, etc. */}
          <div className={styles.searchBar}>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Scrollable Content Area - Main page content */}
        <div className={styles.scrollableContent}>
          {/* Your page content goes here */}
          {/* Examples: Lists, Forms, Tables, etc. */}
        </div>
      </div>

      {/* Optional: Additional bottom sections (like Dashboard's dashBoxes) */}
    </div>
  );
};
```

## SCSS Structure

All page SCSS modules should follow this pattern:

```scss
@use "@/styles/variables" as v;

.pageName {
  min-height: 100vh; // Optional - ensures full viewport height

  // Main content wrapper
  .pageContent {
    background: v.$black;
    border-radius: 0px 0px 32px 32px;
    margin: 0 auto;
    width: calc(100% - 4rem);        // REQUIRED: Standard width
    height: 70vh;                     // Can be adjusted per page needs
    display: flex;
    flex-direction: column;
    overflow: hidden;                 // Prevents outer scrolling
  }

  // Sticky header that stays at top when scrolling
  .stickyHeader {
    position: sticky;
    top: 0;
    background: v.$black;
    padding: 5rem 3rem 0 3rem;       // REQUIRED: Standard padding
    z-index: 10;

    h2 {
      text-transform: uppercase;      // REQUIRED: Standard title style
      margin: 0 0 2rem 0;
    }
  }

  // Scrollable content container
  .scrollableContent {
    flex: 1;                          // Takes remaining space
    padding: 0 3rem 2rem 3rem;       // REQUIRED: Standard padding
    overflow-y: auto;                 // REQUIRED: Allows vertical scrolling
    display: flex;
    flex-direction: column;
  }

  // Standard loading state
  .loadingState {
    text-align: center;
    padding: 3rem 1rem;
    color: v.$text-secondary;
    font-size: 1.125rem;
  }
}
```

## Required CSS Classes

Every page **MUST** have these classes with these exact properties:

### `.pageContent`
```scss
background: v.$black;
border-radius: 0px 0px 32px 32px;
margin: 0 auto;
width: calc(100% - 4rem);  // DO NOT CHANGE - ensures consistent width
display: flex;
flex-direction: column;
overflow: hidden;
```

### `.stickyHeader`
```scss
position: sticky;
top: 0;
background: v.$black;
padding: 5rem 3rem 0 3rem;  // DO NOT CHANGE - ensures consistent spacing
z-index: 10;

h2 {
  text-transform: uppercase;  // DO NOT CHANGE - ensures consistent titles
  margin: 0 0 2rem 0;
}
```

### `.scrollableContent`
```scss
flex: 1;
padding: 0 3rem 2rem 3rem;  // DO NOT CHANGE - matches stickyHeader padding
overflow-y: auto;            // DO NOT CHANGE - allows content to scroll
display: flex;
flex-direction: column;
```

## Optional Elements

### Search Bar
If your page has a search bar, place it inside `.stickyHeader`:

```jsx
<div className={styles.stickyHeader}>
  <h2>Page Title</h2>
  <div className={styles.searchBar}>
    <input
      type="text"
      placeholder="Search..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </div>
</div>
```

```scss
.searchBar {
  margin-bottom: 1.5rem;
  width: 50%;  // or adjust as needed

  input {
    width: 100%;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    border: 1px solid v.$border-color;
    border-radius: 26px;
    transition: all 0.2s;
    background-color: rgba(v.$white, 0.05);
    color: v.$text-primary;

    &:focus {
      outline: none;
      border-color: v.$accent;
      box-shadow: 0 0 0 3px rgba(v.$accent, 0.2);
    }

    &::placeholder {
      color: v.$text-secondary;
    }
  }
}
```

### Action Buttons
If your page has action buttons (like "Add New"), place them in `.stickyHeader`:

```jsx
<div className={styles.stickyHeader}>
  <div className={styles.headerActions}>
    <h2>Page Title</h2>
    <button className="btn-primary" onClick={handleAdd}>
      + Add New Item
    </button>
  </div>
</div>
```

```scss
.headerActions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;

  h2 {
    margin: 0;
  }
}
```

## Current Page Implementations

### Dashboard (`app/containers/Dashboard/Dashboard.jsx`)
- ✅ Follows standard layout
- Has search bar in sticky header
- Scrollable content contains ISCIList or ISCIForm
- Additional bottom section with dashBoxes

### Edit ISCI (`app/containers/EditISCI/EditISCI.jsx`)
- ✅ Follows standard layout
- Simple sticky header with title only
- Scrollable content contains ISCIForm

### Admin (`app/routes/admin.jsx`)
- ✅ Follows standard layout
- Simple sticky header with title only
- Scrollable content contains BrandManager component

## Benefits of This Pattern

1. **Consistency**: All pages look and behave the same way
2. **Predictability**: Users know where to find page titles, actions, and content
3. **Maintainability**: Easy to update all pages by changing this pattern
4. **Responsive**: Structure works well on different screen sizes
5. **Performance**: Sticky headers improve UX without layout shift

## When Adding a New Page

1. Copy the HTML structure from this document
2. Copy the SCSS structure from this document
3. Replace `pageName` with your page name (camelCase)
4. Replace `Page Title` with your actual page title (UPPERCASE)
5. Add your content inside `.scrollableContent`
6. Add any optional elements (search, actions) to `.stickyHeader`

## DO NOT:

- ❌ Change the `width: calc(100% - 4rem)` on `.pageContent`
- ❌ Change the padding `5rem 3rem 0 3rem` on `.stickyHeader`
- ❌ Change the padding `0 3rem 2rem 3rem` on `.scrollableContent`
- ❌ Remove `text-transform: uppercase` from h2 in `.stickyHeader`
- ❌ Change `border-radius: 0px 0px 32px 32px` on `.pageContent`
- ❌ Use inline styles instead of SCSS modules

## DO:

- ✅ Follow this exact structure for all new pages
- ✅ Adjust `height` on `.pageContent` if needed for your content
- ✅ Use `overflow-y: auto` on `.scrollableContent` if content needs to scroll
- ✅ Add custom classes for your specific content inside `.scrollableContent`
- ✅ Keep Header component props consistent

---

**Last Updated**: January 5, 2025
**Applies to Version**: 3.2.0+
