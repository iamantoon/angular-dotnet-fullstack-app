import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Basket, BasketItem, BasketTotals } from '../shared/models/basket';
import { HttpClient } from '@angular/common/http';
import { Product } from '../shared/models/product';

@Injectable({
  providedIn: 'root'
})
export class BasketService {
  baseUrl = environment.apiUrl;

  private basketSource = new BehaviorSubject<Basket | null>(null);
  basketSource$ = this.basketSource.asObservable();

  private basketTotalSource = new BehaviorSubject<BasketTotals | null>(null);
  basketTotalSource$ = this.basketTotalSource.asObservable();

  constructor(private http: HttpClient) { }

  getBasket(id: string){
    return this.http.get<Basket>(this.baseUrl + 'basket?id=' + id).subscribe({
      next: basket => {
        this.basketSource.next(basket);
        this.calculateTotals();
      }
    })
  }

  setBasket(basket: Basket){
    return this.http.post<Basket>(this.baseUrl + 'basket', basket).subscribe({
      next: basket => {
        this.basketSource.next(basket);
        this.calculateTotals();
      }
    })
  }

  getCurrentBasketValue(){
    return this.basketSource.value;
  }

  addItemToBasket(item: Product | BasketItem, quantity = 1){ // пользователь нажал на добавить товар в корзину
    if (this.isProduct(item)) item = this.mapProductItemToBasketItem(item); // товар типа product конвертировали в товар типа basketItem
    const basket = this.getCurrentBasketValue() ?? this.createBasket(); // если в корзине что-то есть, то мы получаем это значение. Если нет, то создаем basket
    basket.items = this.addOrUpdateItem(basket.items, item, quantity); // дальше мы преобразовуем корзину (либо только что созданную либо уже существующущю)
    this.setBasket(basket); // отправляем post-запрос на сервер с новой преобразованной корзиной
  }

  removeItemFromBasket(id: number, quantity: number){
    const basket = this.getCurrentBasketValue();
    if (!basket) return;
    const item = basket.items.find(x => x.id === id);
    if (item) {
      item.quantity -= quantity;
      if (item.quantity === 0) { 
        basket.items = basket.items.filter(x => x.id !== id);
        console.log(basket.items);
      }
      if (basket.items.length > 0) this.setBasket(basket);
      else this.deleteBasket(basket);
    } 
  }

  deleteBasket(basket: Basket){
    return this.http.delete(this.baseUrl + 'basket?id=' + basket.id).subscribe({
      next: () => {
        this.basketSource.next(null);
        this.basketTotalSource.next(null);
        localStorage.removeItem('basket_id');
      }
    })
  }

  private addOrUpdateItem(items: BasketItem[], itemToAdd: BasketItem, quantity: number): BasketItem[] {
    const item = items.find(x => x.id === itemToAdd.id); // находим itemToAdd (товар, который добавляют в корзину) среди basket items
    if (item) item.quantity += quantity; // если этот товар уже в корзине есть, то мы просто обновляем его количество 
    else { 
      itemToAdd.quantity = quantity; // если же товара нет, то мы устанавлием количество, которое выбрал пользователь
      items.push(itemToAdd); // и добавляем такой объект типа BasketItem в массив items типа BasketItem[]
    }
    return items; // из функции возвращаем товары, которые сейчас в корзине
  }

  private createBasket(): Basket {
    const basket = new Basket(); // просто создаем корзину с рандомным (cuid) id и пустым масивом basket items
    localStorage.setItem('basket_id', basket.id); // рандомный id сохраняем в local Storage
    return basket; // возвращаем всю корзину
  }

  private mapProductItemToBasketItem(item: Product): BasketItem {
    return {
      id: item.id,
      productName: item.name,
      price: item.price,
      quantity: 0,
      pictureUrl: item.pictureUrl,
      brand: item.productBrand,
      type: item.productType
    }
  }

  private calculateTotals(){
    const basket = this.getCurrentBasketValue();
    if (!basket) return;
    const shipping = 0;
    const subtotal = basket.items.reduce((a, b) => (b.price * b.quantity) + a, 0);
    const total = subtotal + shipping;
    this.basketTotalSource.next({shipping, total, subtotal});
  }

  private isProduct(item: Product | BasketItem): item is Product {
    return (item as Product).productBrand !== undefined; // возвращает true если item это просто продукт из каталога
  }
}
