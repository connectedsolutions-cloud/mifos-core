# Card Header Styling Guide

## Colors Used

- **Background Color**: `#DBE9F2` (light blue)
- **Text Color**: `#505050` (dark gray)
- **Signature Button Background**: `#DBE9F2` (matches header)
- **Signature Button Hover**: `#C8DDE8` (slightly darker for hover effect)

## Strategy

### Component-Specific SCSS Override

**Approach**: Override styles in the component's SCSS file (e.g., `clients-view.component.scss`) rather than:

- ❌ Modifying global theme files (`_content.scss`)
- ❌ Using inline styles
- ❌ Changing all `mat-card-header` globally

**Why**:

- Scoped to specific component only
- Doesn't affect other account views (loans, savings, etc.)
- Maintainable and easy to locate
- Uses `!important` to override global theme when needed

### Implementation Pattern

```scss
.account-card {
  .header {
    // Override background
    background-color: #dbe9f2 !important;

    // Override text colors
    .header-title-group {
      .account-card-title,
      h1,
      h2,
      h3,
      h4,
      h5,
      h6,
      p,
      span,
      td,
      th,
      div {
        color: #505050 !important;
      }
    }

    // Override signature button if present
    .signature {
      background-color: #dbe9f2 !important;
      color: #505050;

      &:hover {
        background-color: #c8dde8 !important;
      }
    }
  }
}

// Override table text colors
.account-overview {
  color: #505050 !important;

  td,
  b,
  span {
    color: #505050 !important;
  }
}
```

## Steps to Apply to Other Components

1. Locate the component's SCSS file (e.g., `loans-view.component.scss`)
2. Add the `.header` override within `.account-card` selector
3. Use `!important` to override global theme colors
4. Test to ensure it doesn't affect other components

## Files Modified

- `mifos-core/src/app/clients/clients-view/clients-view.component.scss`

## Global Theme Reference

The global theme sets header colors in:

- `mifos-core/src/theme/_content.scss` (lines 38-74)
- Uses `mat.m2-get-color-from-palette($primary, 500)` for background
- Sets text color to `white`

Our component-specific overrides take precedence with `!important`.
