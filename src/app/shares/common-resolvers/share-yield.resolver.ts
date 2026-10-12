import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { SharesService } from '../shares.service';

@Injectable()
export class ShareYieldResolver {
  constructor(private sharesService: SharesService) {}

  resolve(route: ActivatedRouteSnapshot): Observable<any> {
    const shareAccountId = route.parent?.parent?.paramMap.get('shareAccountId') || route.paramMap.get('shareAccountId');
    return this.sharesService.getShareYield(shareAccountId);
  }
}
