/** Angular Imports */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

/** Custom Directives */
import { HasPermissionDirective } from './has-permission/has-permission.directive';
import { IsEnabledDirective } from './is-enabled/is-enabled.directive';
import { FormatAmountDirective } from './format-amount.directive';
import { ValidateOnFocusDirective } from './validate-on-focus.directive';

/**
 *  Directives Module
 *
 *  All custom directives should be declared and exported here.
 */
@NgModule({
  imports: [
    CommonModule,
    HasPermissionDirective,
    IsEnabledDirective,
    FormatAmountDirective,
    ValidateOnFocusDirective
  ],
  exports: [
    HasPermissionDirective,
    IsEnabledDirective,
    FormatAmountDirective,
    ValidateOnFocusDirective
  ]
})
export class DirectivesModule {}
