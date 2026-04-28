import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductsService } from '../products.service';

@Injectable()
export class ManageMhDteItemComponentsResolver {
  constructor(private productsService: ProductsService) {}

  resolve(): Observable<any> {
    return this.productsService.getMhDteItemComponents();
  }
}
