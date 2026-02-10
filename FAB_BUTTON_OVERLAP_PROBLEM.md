# FAB Button Overlap Problem - Analysis

## Problem
On listing pages (Employee, Product, Customer, Area), when the Add/Edit modal is open, the FAB (Floating Action Button - the "+" button) appears OVER the Save button in the modal, making it difficult to click Save.

## Root Cause

### Z-Index Issue
In [components.css](mimipro -admin/css/components.css):

**Modal:**
```css
.modal {
    z-index: 30;  /* ⚠️ LOWER */
}
```

**FAB Button:**
```css
.fab {
    position: fixed;
    right: 20px;
    bottom: 90px;
    z-index: 100;  /* ⚠️ HIGHER - appears on top! */
}
```

### Visual Issue
```
User clicks FAB (+) → Modal opens → FAB still visible on top
                                              ↓
                                    [Modal Save Button]
                                          ↓
                              [FAB overlaps here!] ❌
```

## Affected Pages
1. [Employee Listing](mimipro -admin/js/modules/employeeListing.js#L35)
2. [Product Listing](mimipro -admin/js/modules/productListing.js#L35)
3. [Customer Listing](mimipro -admin/js/modules/customerListing.js#L37)
4. [Area Listing](mimipro -admin/js/modules/areaListing.js#L33)

## Solutions

### Option 1: Hide FAB when modal is open ✅ RECOMMENDED
- Most logical: Don't need "Add" button when already adding
- Clean UX
- No z-index conflicts

### Option 2: Increase modal z-index
- Modal z-index: 30 → 200
- Would fix overlap but FAB still visible (unnecessary)

### Option 3: Decrease FAB z-index  
- FAB z-index: 100 → 20
- Would hide FAB under modal
- But might conflict with other elements

## Recommended Fix
**Hide FAB when modal is open:**

```css
/* When modal is open, hide the FAB */
.modal.show ~ .fab,
body:has(.modal.show) .fab {
    opacity: 0;
    pointer-events: none;
    transform: scale(0.8);
}
```

Or add JavaScript to toggle FAB visibility when modal opens/closes.
