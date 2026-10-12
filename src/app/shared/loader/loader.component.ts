import { ChangeDetectionStrategy, Component, Input, numberAttribute } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

/** Shared indeterminate loader; animation styles also serve the pre-bootstrap logo. */
@Component({
  selector: 'mifosx-loader',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoaderComponent {
  @Input({ transform: numberAttribute }) diameter = 80;
}
