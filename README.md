# REAMDE.md

Proyecto de e-commerce en Javascript consumiendo una API Rest. Muestra un home con los productos con descuentos y una tienda con todos los productos que existen en ella, con funcionalidades para filtrar por categoria y rango de precios además de ordenar por nombre y precio de productos, además cuenta con un buscador para encontrar el producto deseado con mayor facilidad.

## Contenido
Dentro de este proyecto encontrarás una carpeta `./src`con las 2 paginas HTML, además de una carpeta `./src/js` donde hallarás los archivos javascript para la funcionalidad de esta.

## Características
- Home con productos con descuentos
- Tienda con funcionalidad de filtros, buscador y paginación
- Carrito de compras

## Demo
Si quieres ver una demo de este proyecto, puedes visitar [Demo del proyecto](https://pacific-river-42460.herokuapp.com/)


------------

# Documentación

## Métodos

Los métodos más relevantes se detallarán a continuación.

### showProducts(url, search, start)

Funcion que consume la api y obtiene el resultado de los productos paginados.

| Name | Type | Default | Description |
| ------------ | ------------ | ------------ | ------------ |
| `url`      | string      ||url del endpoint de la API |
| `search`   | string    |null|Texto a buscar |
| `start`   | boolean    |false|`true` si es la primera vez que se llama a la funcion |

```javascript
function showProducts(url, search = null, start = false){
    let request = {
        url: url,
        method: 'GET',
        data: {
            q: search,
            s: start,
            /** Se agrega un parametro o para que la API retorne los productos ordenados. */
            o: orderingSelected
        },
        beforeSend: function () {
            /** se inicia y muestra el loading al iniciar la llamada a la API */
            $('.modal_loading').modal('show');
        },
        complete: function(){
            /** Se esconde el loading despues de terminada la operacion */
            setTimeout(function(){
                $('.modal_loading').modal('hide');
            }, 500);
        },
        success: function(response) {
            /** En caso que sea la primera vez que se llama a la funcion */
            if(start){
                /** Se agregan los filtros de categorias y rangos de Precios
                 * tambien se deja la variable start como falso para que no realice esta operacion nuevamente
                 */
                showCategories(response.data2);
                startRange(response.data3[0].min, response.data3[0].max);
                start = false;
            }
            /** Llama a la funcion que dibuja la galeria con las tarjetas de los productos */
            fillGrid(response.data.data);
            /** Se procede a llamar a la funcion que implementa la paginacion*/
            pagination(response.data.links);
        },
        error: function (request, status, error) {
            /** Si hubo algún error se despliega este mensaje en un alerta con Sweet Alert */
            Swal.fire(
                'Error!',
                'Ha ocurrido un error interno, por favor intente más tarde',
                'error'
            );
        }
    };

    $.ajax(request);
};
```

### showProductsFilter(url, options)

Funcion que consume la API enviandole algunos filtros `(rango de precios y categorias seleccionadas)` y obtiene los resultados paginados.

| Name | Type                    |Default|Description|
| ------------ | ------------ | ------------ | ------------ |
| `url`      | string      ||url del endpoint de la API |
| `options`   | Object    |null|Objeto con las opciones de filtrado |

```javascript
function showProductsFilter(url, options = null){
    let request = {
        url: url,
        method: 'POST',
        data: {
            options: options
        },
        beforeSend: function () {
            /** se inicia y muestra el loading al iniciar la llamada a la API */
            $('.modal_loading').modal('show');
        },
        complete: function(){
            /** Se esconde el loading despues de terminada la operacion */
            setTimeout(function(){
                $('.modal_loading').modal('hide');
            }, 500);
        },
        success: function(response) {
            /** Llama a la funcion que dibuja la galeria con las tarjetas de los productos */
            fillGrid(response.data.data);
            /** Se procede a llamar a la funcion que implementa la paginacion*/
            pagination(response.data.links);
        },
        error: function (request, status, error) {
            /** Si hubo algún error se despliega este mensaje en un alerta con Sweet Alert */
            Swal.fire(
                'Error!',
                'Ha ocurrido un error interno, por favor intente más tarde',
                'error'
            );
        }
    };

    $.ajax(request);
};
```

### fillGrid(products)

Agrega los productos como galeria en el DOM, con la informacion y el botón de agregar al carrito.


| Name | Type | Default | Description |
| ------------ | ------------ | ------------ | ------------ |
| `products`   | Array    |  | Lista de productos |

```javascript
function fillGrid(products){
    /** Empieza limpiando el elemento que contiene la galeria de productos */
    $('#gallery-products').empty();
    
    /** Analiza la lista de productos */
    products.map((product) => {
        /** variable que guardará codigo HTML referente al precio que se agregará a la tarjeta de producto */
        let price = '';

        /** Si el producto contiene descuento, entonces se agrega el codigo HTML contemplando el precio inicial y el precio con descuento 
         * de lo contrario, solo se agregará el precio inicial
        */
        if(product.discount > 0){
            price = `
            <div class="product-price">                      
                <del>${ new Intl.NumberFormat("es-CL", {style: "currency", currency: "CLP", minimumFractionDigits: 0}).format((product.price)) } CLP</del> 
                <ins>${ new Intl.NumberFormat("es-CL", {style: "currency", currency: "CLP", minimumFractionDigits: 0}).format((product.price - ((product.price * product.discount) / 100))) } CLP</ins>
            </div>
            `;
        }else{
            price = `
            <div class="product-price">
                <ins>${ new Intl.NumberFormat("es-CL", {style: "currency", currency: "CLP", minimumFractionDigits: 0}).format(product.price) } CLP</ins>
            </div>
            `;
        }

        /** Agrega el codigo HTML de la tarjeta de producto a la galeria, con sus respectivos datos como, imagen, nombre, precio */
        $('#gallery-products').append(`
            <div class="col-md-4 mb-5">
                <div class="card h-100">
                    ${product.discount > 0 ? '<div class="ribbon"><span>-'+product.discount+'%</span></div>' : ''}
                    <!-- Product image-->
                    <div style="height: 15em; text-align: center;">
                        <img class="img-thumbnail" src="${product.url_image ? product.url_image : "https://dummyimage.com/450x300/b0b0b0/dbdbdb.jpg&text=BSALE"}" />
                    </div>
                    <!-- Product details-->
                    <div class="card-body">
                        <div class="text-center">
                            <!-- Product name-->
                            <h5 class="fw-bolder">${product.name}</h5>
                            <!-- Product price-->
                            ${price}
                        </div>
                    </div>
                    <!-- Product actions-->
                    <div class="card-footer p-4 pt-0 border-top-0 bg-transparent">
                        <div class="text-center"><a class="btn btn-outline-dark mt-auto add-to-cart" data-product="${encodeURIComponent(JSON.stringify(product))}" style="border-radius: 5px" href="#"><i class="bi-cart-plus-fill" style="font-size: 1.5rem;"></i> Agregar al Carrito</a></div>
                    </div>
                </div>
            </div>
        `);
    });
}
```

### showCategories(categories)

Agrega los el filtro de categorias, con el nombre y la cantidad de productos por categoría.


| Name | Type | Default | Description |
| ------------ | ------------ | ------------ | ------------ |
| `categories`   | Array    | [] | Lista de categorias |

```javascript
function showCategories(categories = []){
    /** Recorre la lista de categorias */
    categories.map((category, index) => {
        /** Agrega la categoria con un checkbox al contenedor del filtro con sus repectivos datos (id, name, count) */
        $('#categories').append(`
            <div class="d-flex justify-content-between mt-2">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" name="categories[]" value="${category.id}" id="filter${index + 1}">
                    <label class="form-check-label" for="filter${index + 1}"> ${capitalize(category.name)} </label>
                </div>
                <span class="form-check-span">${category.count}</span>
            </div>
        `);
    });
}
```
### pagination(links)

Agrega los elementos para la paginacion en el DOM según la cantidad de paginas sean con sus respectivos enlaces a la API


| Name | Type | Default | Description |
| ------------ | ------------ | ------------ | ------------ |
| `links`   | Array    | [] | Lista de links de paginación |

```javascript
function pagination(links){
    /** Limpia el contenedor de la paginacion */
    $('#pagination').empty();
    /** Recorre la lista de links de paginacion */
    links.map((link, i) => {
        /** Si el indice es el primero (si es 0) entonces agrega el primer link con el texto '<<' */
        if(i==0){
            $('#pagination').append(`
                <li class="page-item ${!link.url ? 'disabled' : ''}">
                    <a class="page-link" href="${link.url}" tabindex="-1" aria-disabled="${link.url ? false : true}"><<</a>
                </li>
            `);
        }
        /** Si el indice es el ultimo entonces agrega el link con el texto '>>' */
        else if(i==links.length - 1){
            $('#pagination').append(`
                <li class="page-item ${!link.url ? 'disabled' : ''}">
                    <a class="page-link" href="${link.url}" aria-disabled="${link.url ? false : true}">>></a>
                </li>
            `);
        }
        /** De lo contrario agrega el enlace como cualquier otro */
        else{
            $('#pagination').append(`
                <li class="page-item ${link.active ? 'active' : ''}"><a class="page-link" href="${link.url}">${link.label}</a></li>
            `);
        }
    });
}
```
### addToCart(product)

Funcion que agrega los productos en el carrito.


| Name | Type | Default | Description |
| ------------ | ------------ | ------------ | ------------ |
| `product`   | Object    |  | Objeto de producto |

```javascript
function addToCart(product) {
    /** Verifica si bsale_cart existe en el localStorage, si no existe lo crea con un arreglo vacio */
    if(localStorage.getItem('bsale_cart') == null){
        let cart = [];
        /** agrega el arreglo vacio a la llave bsale_cart en el localStorage convirtiendolo a string */
        localStorage.setItem('bsale_cart', JSON.stringify(cart))
    }

    /** Obtiene lo que contiene bsale_cart convertido en json */
    let cart = JSON.parse(localStorage.getItem('bsale_cart'))
    /** Le agrega la llave quantity y la inicializa en 1 */
    product.quantity = 1;
    /** Busca el producto en el carrito si es que existe */
    let productFound = cart.filter(cart => cart.id == product.id);
    
    /** Si el producto no se encontro en el carrito, entonces lo agrega como producto nuevo dentro de el */
    if(productFound.length == 0){
        cart.push(product)
    }else{
        /** En el caso de que si exista en el carrito, entonces se busca el producto en el carrito */
        cart.map(cart => {
            /** Cuando encuentra el producto, solo le suma 1 al quantity del producto */
            if(cart.id == product.id){
                cart.quantity++;
            }
        });
    }

    /** Devuelve el carrito al localStorage convirtiendolo a string */
    localStorage.setItem('bsale_cart', JSON.stringify(cart))

    /** Actualiza el contador del icono de carrito de compras en el header */
    updateCart();
};
```

### addToCart(product)

Dibuja la tabla de lo que contiene el carrito en la ventana modal.

```javascript
function drawCart(){
    /** Obtiene lo que contiene bsale_cart convertido en json */
    let cart = JSON.parse(localStorage.getItem('bsale_cart'));
    /** Limpia el contenedor de la tabla en la ventana modal */
    $("#cart-container").empty();
    /** Inicializa el total de la suma de todos los precios de productos con sus cantidades en el carrito en 0 */
    let total = 0;
    /** Recorre el carrito y va agregando una fila con sus columnas y valores como image, name, id, quantity, etc a la tabla */
    cart.map((product) => {
        $("#cart-container").append(`
            <tr scope="row">
                <td>
                    <div class="row">
                        <div class="col-md-6">
                            <div style="height: 5em; text-align: center;">
                                <img class="img-thumbnail" src="${product.url_image ? product.url_image : "https://dummyimage.com/450x300/b0b0b0/dbdbdb.jpg&text=BSALE"}" />
                            </div>
                        </div>
                        <div class="col-md-6">
                            <h5><p>${ product.name }</p></h5>
                        </div>
                    </div>
                </td>
                <td>${ new Intl.NumberFormat("es-CL", {style: "currency", currency: "CLP", minimumFractionDigits: 0}).format(((product.price - (product.price*product.discount) / 100))) }</td>
                <td>
                    <span class="min increment button-min" data-id="${product.id}">
                    -
                    </span>
                    <input type="text" class="increment-field" id="qty-${product.id}" value="${product.quantity}" readonly/>
                    <span class="plus increment button-plus" data-id="${product.id}">
                    +
                    </span>
                </td>
                <td id="total-price-${product.id}">${ new Intl.NumberFormat("es-CL", {style: "currency", currency: "CLP", minimumFractionDigits: 0}).format(((product.price - (product.price*product.discount) / 100)) * product.quantity) } CLP</td>
                <td><span style="cursor:pointer; color:red;" class="remove" data-id="${product.id}"><i class="bi bi-dash-circle"></i></span></td>
            </tr>
        `);
        /** Va sumando el precio al total pero con el porcentaje de descuento */
        total += ((product.price - (product.price*product.discount) / 100)) * product.quantity;
    });

    /** Finalmente agrega la suma de precios total al final de la tabla, formateada en pesos */
    $("#cart-container").append(`
        <tr scope="row">
            <td colspan="2"></td>
            <td>
                <h4>Total:</h4>
            </td>
            <td><h4 id="total">${ new Intl.NumberFormat("es-CL", {style: "currency", currency: "CLP", minimumFractionDigits: 0}).format(total) } CLP</h4></td>
        </tr>
    `);
};
```


------------


### showProducts(url, quantity)

Funcion que consume la api y obtiene el resultado de los productos con oferta preferencialmente y limitados por una cantidad.

| Name | Type | Default | Description |
| ------------ | ------------ | ------------ | ------------ |
| `quantity`      | number      ||Cantidad de productos seran retornados por la API |

```javascript
function showProducts(url, quantity = null){
    let request = {
        url: url,
        method: 'GET',
        data: {
            quantity: quantity
        },
        beforeSend: function () {
            /** se inicia y muestra el loading al iniciar la llamada a la API */
            $('.modal_loading').modal('show');
        },
        complete: function(){
            /** Se esconde el loading despues de terminada la operacion */
            setTimeout(function(){
                $('.modal_loading').modal('hide');
            }, 500);
        },
        success: function(response) {
            /** Llama a la funcion que dibuja la galeria con las tarjetas de los productos */
            fillGrid(response.data);
        },
        error: function (request, status, error) {
            /** Si hubo algún error se despliega este mensaje en un alerta con Sweet Alert */
            Swal.fire(
                'Error!',
                'Ha ocurrido un error interno, por favor intente más tarde',
                'error'
            );
        }
    };

    $.ajax(request);
};
````
