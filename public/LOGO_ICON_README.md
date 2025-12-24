# Logo Icon Setup

To use the MindLists logo icon (head with checkmarks) without the white space:

## Steps

1. **Extract the icon** from your logo image:
   - Remove the background/white space
   - Keep only the head icon with checkmarks and list lines
   - Save it as an SVG or PNG file

2. **Place the icon file** in the `public` folder:
   - Save as `logo-icon.svg` (recommended for scalability)
   - Or save as `logo-icon.png` (if you prefer PNG)

3. **File formats:**
   - **SVG** (recommended): `public/logo-icon.svg` - scales perfectly at any size
   - **PNG**: `public/logo-icon.png` - use a high resolution (at least 512x512px)

## Where the icon is used

- Header navigation (top left)
- Login page (centered above the form)
- Browser favicon/tab icon
- Can be used anywhere with the `<Logo />` component

## Logo Component Usage

```vue
<!-- Icon only -->
<Logo />

<!-- Icon with text -->
<Logo :show-text="true" />

<!-- Different sizes -->
<Logo size="sm" />  <!-- Small (24x24) -->
<Logo size="md" />  <!-- Medium (32x32) - default -->
<Logo size="lg" />  <!-- Large (48x48) -->
```

## Notes

- The icon should have a transparent background
- For best results, use SVG format
- The icon will automatically scale based on the size prop

