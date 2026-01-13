# Performance History Container Styling Guide

## Overview

This guide documents the styling updates for the `performance-history-container` div and its internal table elements.

## Container Styling

Apply these styles to `.performance-history-container`:

```scss
.performance-history-container {
  border: none; // Remove border
  background-color: #e9e9e9; // Light gray background
  border-radius: 8px; // Rounded corners
  padding: 1%; // Existing padding (keep as-is)
}
```

## Table Styling Inside Container

Remove all borders from the table and its cells:

```scss
.performance-history-container {
  // ... container styles above ...

  table {
    border: none;

    td,
    th {
      border: none;
    }
  }
}
```

## Complete Example

```scss
.performance-history-container {
  border: none;
  background-color: #e9e9e9;
  border-radius: 8px;
  padding: 1%;

  table {
    border: none;

    td,
    th {
      border: none;
    }
  }
}
```

## Important Notes

1. **Scope**: Always scope these styles within the component's `.tab-container` or parent class to avoid affecting other elements
2. **Specificity**: The nested structure ensures only tables inside `performance-history-container` are affected
3. **Global Styles**: These styles override global table border styles defined in `_border.scss`

## Files Updated

- `/app/clients/clients-view/general-tab/general-tab.component.scss`
- `/app/loans/loans-view/general-tab/general-tab.component.scss`
