$( document ).ready(function() {
    const DOMAIN = "https://fierce-woodland-71648.herokuapp.com";
    /** URL inicial a la API */
    const URL_START = `${DOMAIN}/api/some`;
    /** constante que contiene la cantidad de productos retornados por la API */
    const QUANTITY = 6;
    
    // Se buscan los productos limitados por la cantidad al iniciar la pagina
    showProducts(URL_START, QUANTITY);

    /** Actualiza el contador del icono de carrito de compras en el header */
    updateCart();

    /**
    *  Funcion que consume la api y obtiene el resultado de los productos con oferta preferencialmente y limitados por una cantidad.
    *  @param {number} quantity -  cantidad de productos seran retornados por la API.
    */
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
                /** Si el status es 1, el retorno es exitoso, entonces procede a realizar las siguiente acciones */
                if(response.status == 1){
                    /** Llama a la funcion que dibuja la galeria con las tarjetas de los productos */
                    fillGrid(response.data);
                }

                /** Cuando el status es 2, quiere decir que ocurrio algun problema y se muestra una alerta */
                if(response.status == 2){
                    Swal.fire(
                        'Ups!',
                        response.message,
                        'error'
                      );
                }
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

    /**
     * Agrega los productos como galeria en el DOM, con la informacion y el botón de agregar al carrito
     * @param {Array} products - lista de productos.
     */
    function fillGrid(products = []){
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

    /**
    * Al hacer click en el botón search se redirecciona a la pagina shop.html con el texto a buscar
    */
    $('#btn-search').on('click', function(){
        window.location.replace(`https://pacific-river-42460.herokuapp.com/src/shop.html?q=${$('#search').val()}`);
    });

    /**
    * En caso de que al escribir en el buscador presione la tecla enter igualmente se redirecciona a la pagina shop.html con el texto a buscar
    */
    $('#search').keyup(function(e){
        if(e.keyCode == 13)
            window.location.replace(`https://pacific-river-42460.herokuapp.com/src/shop.html?q=${$(this).val()}`);
    });

    /**
    * Al hacer click en el boton agregar al carrito obtiene el producto en la data del elemento y lo envia a la funcion addToCart
    */
    $(document).on('click', '.add-to-cart', function () {
        let product = JSON.parse(decodeURIComponent($(this).data("product")));
        addToCart(product);
    });

    /**
     *  Funcion que agrega los productos en el carrito.
     *  @param {Object} product - objeto de producto.
     */
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

    /**
     *  Actualiza el contador del icono de carrito de compras en el header
     */
    function updateCart(){
        /** Verifica si bsale_cart existe en el localStorage, si no existe lo crea con un arreglo vacio */
        if(localStorage.getItem('bsale_cart') == null){
            let cart = [];
            /** agrega el arreglo vacio a la llave bsale_cart en el localStorage convirtiendolo a string */
            localStorage.setItem('bsale_cart', JSON.stringify(cart))
        }

        /** Obtiene lo que contiene bsale_cart convertido en json */
        let cart = JSON.parse(localStorage.getItem('bsale_cart'));

        /** Actualiza el contador del header con la cantidad total de productos diferentes en el carrito */
        $("#cart-counter").text(cart.length);
    }

    /**
     *  Agrega el carrito en la ventana modal cuando se hace click en el boton del carrito en el header
     */
    $("#cart-button").on("click", function(){
        drawCart();
    });

    /**
     *  Dibuja la tabla de lo que contiene el carrito en la ventana modal
     */
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
    }

    /**
     *  En caso de clickear el boton menos en la columna cantidad de la tabla en el carrito
     *  le resta 1 a la cantidad
     */
    $(document).on('click', '.button-min', function () {
        /** Obitene el id del producto que se guardó en la fila donde se encuentra el boton que se está clickeando */
        let productId = $(this).data("id");
        /** Obtiene lo que contiene bsale_cart convertido en json */
        let cart = JSON.parse(localStorage.getItem('bsale_cart'));
        /** Variable que guardará la suma total de los precios de productos en el carrito */
        let total = 0;
        /** Itera todos los productos en el carrito */
        cart.map(product => {
            /** 
             * Si encuentra el producto en el carrito y ademas el prducto tiene una cantidad mayor a 1 entonces
             * le resta 1 a la cantidad
             */
            if(product.id == productId && product.quantity > 1){
                product.quantity--;
                /** Actualiza el contador de quantity en la ventana modal */
                $(`#qty-${product.id}`).val(product.quantity);
                /** Actualiza el total de precios de ese producto en especifico en el carrito */
                $(`#total-price-${product.id}`).text(`${new Intl.NumberFormat("es-CL", {style: "currency", currency: "CLP", minimumFractionDigits: 0}).format(((product.price - (product.price*product.discount) / 100)) * product.quantity) } CLP`);
            }
            /** Va sumando el precio al total pero con el porcentaje de descuento */
            total += ((product.price - (product.price*product.discount) / 100)) * product.quantity;
        });
        /** Finalmente actualiza la suma de precios total al final de la tabla, formateada en pesos */
        $("#total").text(`${ new Intl.NumberFormat("es-CL", {style: "currency", currency: "CLP", minimumFractionDigits: 0}).format(total) } CLP`);
        /** Actualiza el carrito al localStorage convirtiendolo a string */
        localStorage.setItem('bsale_cart', JSON.stringify(cart));
    });

    /**
     *  En caso de clickear el boton mas en la columna cantidad de la tabla en el carrito
     *  le suma 1 a la cantidad
     */
    $(document).on('click', '.button-plus', function () {
        /** Obitene el id del producto que se guardó en la fila donde se encuentra el boton que se está clickeando */
        let productId = $(this).data("id");
        /** Obtiene lo que contiene bsale_cart convertido en json */
        let cart = JSON.parse(localStorage.getItem('bsale_cart'));
        /** Variable que guardará la suma total de los precios de productos en el carrito */
        let total = 0;
        /** Itera todos los productos en el carrito */
        cart.map(product => {
            /** 
             * Si encuentra el producto en el carrito y ademas el prducto tiene una cantidad menor a 10 entonces
             * le suma 1 a la cantidad
             */
            if(product.id == productId && product.quantity < 10){
                product.quantity++;
                /** Actualiza el contador de quantity en la ventana modal */
                $(`#qty-${product.id}`).val(product.quantity);
                /** Actualiza el total de precios de ese producto en especifico en el carrito */
                $(`#total-price-${product.id}`).text(`${new Intl.NumberFormat("es-CL", {style: "currency", currency: "CLP", minimumFractionDigits: 0}).format(((product.price - (product.price*product.discount) / 100)) * product.quantity) } CLP`);
            }
            /** Va sumando el precio al total pero con el porcentaje de descuento */
            total += ((product.price - (product.price*product.discount) / 100)) * product.quantity;
        });
        /** Finalmente actualiza la suma de precios total al final de la tabla, formateada en pesos */
        $("#total").text(`${ new Intl.NumberFormat("es-CL", {style: "currency", currency: "CLP", minimumFractionDigits: 0}).format(total) } CLP`);
        /** Actualiza el carrito al localStorage convirtiendolo a string */
        localStorage.setItem('bsale_cart', JSON.stringify(cart));
    });

    /**
     *  En caso de clickear el boton eliminar en la ultima columna de la tabla en el carrito
     *  elimina el producto del carrito
     */
    $(document).on('click', '.remove', function () {
        /** Obitene el id del producto que se guardó en la fila donde se encuentra el boton que se está clickeando */
        let productId = $(this).data("id");
        /** Obtiene lo que contiene bsale_cart convertido en json */
        let cart = JSON.parse(localStorage.getItem('bsale_cart'));

        /** 
         * Filtra el carrito con todos los productos menos el producto que se va a eliminar
         * de esta forma, el producto se elimina del Carrito
         */
        let newCart = cart.filter(product => product.id !== productId);

        /** Agrega el nuevo carrito al localStorage */
        localStorage.setItem('bsale_cart', JSON.stringify(newCart));

        /** Actualiza el contador del icono de carrito de compras en el header*/
        $("#cart-counter").text(newCart.length);

        /** Actualiza el carrito de compras en el DOM */
        drawCart();
    });
});

