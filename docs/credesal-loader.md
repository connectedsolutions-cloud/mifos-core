# Credesal loader

`LoaderComponent` (`src/app/shared/loader/`) is the shared standalone indeterminate
loading indicator. Import it into the consuming component and use:

```html
<mifosx-loader *ngIf="loading" diameter="80"></mifosx-loader>
```

`diameter` accepts numeric bindings or a numeric HTML attribute, in pixels. Keep
loading state, request counting, and disabled-button behavior in the consumer.
The accessible status label uses the existing `labels.buttons.Loading`
translation. Decorative shapes are hidden from assistive technology.

The startup fallback in `src/index.html` uses the same markup and global styles
without Angular, so it displays before bootstrap. Animation geometry and timing
live in `src/assets/styles/_loader.scss`, included through the global helper
stylesheet. Keep the startup markup and component template in sync when changing
logo structure.

The seven-second loop rotates around the vertical axis: three turns in the first
two seconds, deceleration through the next four, then acceleration during the
last second. Circles face the camera, the blue center stays fixed, and a separate
connector layer always remains behind the circles. Blur follows the speed curve.
Reduced-motion preferences display a sharp, static logo.

Integration covers the shell's non-blocking HTTP activity indicator, startup,
authentication, account transfers, and existing circular/legacy loading widgets
in pages and forms. Existing determinate progress bars retain their progress
semantics. The shell initializes from the active request count and removes its
indicator when the final request completes.

`docs/previews/credesal-loader.html` is a standalone preview snapshot with pause
and timeline controls. Its animation CSS is compiled from `_loader.scss`; refresh
that embedded CSS when changing the source animation.
