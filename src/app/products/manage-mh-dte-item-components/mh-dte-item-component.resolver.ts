import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { ProductsService } from '../products.service';

@Injectable()
export class MhDteItemComponentResolver {
  constructor(private productsService: ProductsService) {}

  resolve(route: ActivatedRouteSnapshot): Observable<any> {
    let id = route.paramMap.get('id');
    if (!id && route.parent) {
      id = route.parent.paramMap.get('id');
    }
    return this.productsService.getMhDteItemComponent(id!);
  }
}
