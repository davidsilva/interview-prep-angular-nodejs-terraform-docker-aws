import { Routes } from '@angular/router';
import { ProductsHomeComponent } from './products/components/products-home/products-home.component';
import { UsersHomeComponent } from './users/components/users-home/users-home.component';
import { UsersUpdateComponent } from './users/components/users-update/users-update.component';
import { UsersCreateComponent } from './users/components/users-create/users-create.component';
import { UsersListComponent } from './users/components/users-list/users-list.component';
import { ProductsListComponent } from './products/components/products-list/products-list.component';
import { ProductsCreateComponent } from './products/components/products-create/products-create.component';
import { ProductsUpdateComponent } from './products/components/products-update/products-update.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/users',
    pathMatch: 'full',
  },
  {
    path: 'products',
    component: ProductsHomeComponent,
    children: [
      {
        path: '',
        component: ProductsListComponent,
      },
      {
        path: 'new',
        component: ProductsCreateComponent,
      },
      {
        path: 'update/:productId',
        component: ProductsUpdateComponent,
      },
    ],
  },
  {
    path: 'users',
    component: UsersHomeComponent,
    children: [
      {
        path: '',
        component: UsersListComponent,
      },
      {
        path: 'new',
        component: UsersCreateComponent,
      },
      {
        path: 'update/:userId',
        component: UsersUpdateComponent,
      },
    ],
  },
];
