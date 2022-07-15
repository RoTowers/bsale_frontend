$( document ).ready(function() {
    const DOMAIN = "https://fierce-woodland-71648.herokuapp.com";
    /** URL inicial a la API */
    const URL_START = `${DOMAIN}/api/products`;
    /** variable que contiene true si la accion actual es por una busqueda de texto */
    let isSearch = false;
    /** variable que contiene true si la accion actual es por filtro */
    let isFilter = false;
    /** Contiene el texto ingresado del buscador */
    let searchText = '';
    /** Guarda las categorias seleccionadas en un arreglo */
    let categoriesSelected = [];
    /** Objeto que contiene los valores seleccionados del filtro de rango de precios */
    let priceFilter = {};
    /** Contiene el valor de el select de ordenamiento */
    let orderingSelected = 1;

    /** Actualiza el contador del icono de carrito de compras en el header */
    updateCart();

    /** Llama a la funcion que inicia la primera llamada a la API por los productos */
    init();

    /**
     * Funcion que inicia cuando se carga la pagina, haciendo la primera llamada a la API
     */
    function init(){
         /** Se obtiene la url de la pagina*/
        let url_string = window.location.href;
         /** Se genera un objecto URL en base a la url_string */
        let url = new URL(url_string);
         /** Obtiene el valor del parametro q */
        let textToSearch = url.searchParams.get("q");

        /** Si se encuentra el parametro q en la url entonces procesa el texto de busqueda y llama a la API */
        if (textToSearch != null) {
            /** Obtiene el texto en el parametro q y lo guarda*/
            searchText = textToSearch;
            /** Lo agrega en el <input type="text"> de la busqueda */
            $("#search").val(searchText);
    
            /** Se resetea el ordenamiento */
            if(isFilter){
                $("#ordering-select").val('1');
                orderingSelected = $("#ordering-select").val();
            }
            /** Se genera la url para la peticion */
            let url = `${DOMAIN}/api/search`;
            /** Se deja isSearch en true y isFilter en false ya que esta accion sera una busqueda por texto */
            isSearch = true;
            isFilter = false;
            /** Se envian estos parametros a la funcion que consume la API */
            showProducts(url, searchText, true);
        }else{
            /** 
             * En el caso que no se encuentre el parametro q, entonces la carga de la pagino no es por busqueda de Texto
             * entonces se llama a la funcion normalmente
             */
            showProducts(URL_START, null, true);
        }
    };

    /**
     * Funcion que consume la api y obtiene los resultados paginados.
     * @param {string} url - url del endpoint de la API.
     * @param {string} search - texto a buscar.
     * @param {string} start - true si es la primera vez que se llama a la funcion.
     */
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
                /** Si el status es 1, el retorno es exitoso, entonces procede a realizar las siguiente acciones */
                if(response.status == 1){
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
     * Funcion que consume la api enviandole algunos filtros (rango de precios y categorias seleccionadas) y obtiene los resultados paginados.
     * @param {string} url - url del endpoint de la API.
     * @param {Object} options - objeto con las opciones de filtrado.
     */
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
                /** Si el status es 1, el retorno es exitoso, entonces procede a realizar las siguiente acciones */
                if(response.status == 1){
                    /** Llama a la funcion que dibuja la galeria con las tarjetas de los productos */
                    fillGrid(response.data.data);
                    /** Se procede a llamar a la funcion que implementa la paginacion*/
                    pagination(response.data.links);
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
     * Agrega los el filtro de categorias, con el nombre y la cantidad de productos por categoria
     * @param {Array} categories - lista de categorias.
     */
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

    /**
     * Agrega los elementos para la paginacion en el DOM según la cantidad de paginas sean con sus respectivos enlaces a la API
     * @param {Array} link - lista de categorias.
     */
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

    /*
    * Al hacer click en el botón search se llama a la funcion showProducts con la url para realizar la busqueda y con el texto a buscar
    * Se deja isSearch como true para que al clickear la paginacion la funcion sepa que debe agregar el texto a buscar
    */
    $('#btn-search').on('click', search);

    // En caso de que al escribir en el buscador presione la tecla enter
    $('#search').keyup(function(e){
        if(e.keyCode == 13)
            search();
    });

    /**
     * Funcion que realiza el proceso de busqueda
     */
    function search(){
        /**
         * En el caso que la ultima accion sea el filtro de productos
         * Se resetea el ordenamiento
         */
        if(isFilter){
            $("#ordering-select").val('1');
            orderingSelected = $("#ordering-select").val();
        }

        /** Obtiene el texto a buscar de la <input type="text"> de busqueda */
        searchText = $("#search").val();
        /** Genera la url del endpoint de busqueda de la API */
        let url = `${DOMAIN}/api/search`;

        /** Deja isSearch en true, ya que esta accion es de busqueda
         * isFilter en false ya que no será una llamada por filtros */
        isSearch = true;
        isFilter = false;
        
        /** Llama a la funcion con sus parametros para retornar los productos */
        showProducts(url, searchText);
    }

    /**
    * Al hacer click en la paginacion se llama a la funcion que consume la api y obtiene los productos
    * si isSearch es true, entonces se agrega el texto a buscar
    */
    $("body").on("click", '.pagination a', function(e){
        /** detiene la peticion */
        e.preventDefault();
        /** obtiene la url del atributo href del elemento */
        let url = $(this).attr('href');

        /**
        * Si es una busqueda (isSearch) entonces llama a la funcion showProducts con sus parametros
        */
        if(isSearch){
            showProducts(url, searchText);
        }
        /**
        * Si es una busqueda por filtros (isFilter) entonces llama a la funcion showProductsFilter con sus parametros
        */
        else if(isFilter){
            showProductsFilter(url, {
                categories: categoriesSelected,
                price: priceFilter,
                order: orderingSelected
            });
        }
        /**
        * De lo contrario llama a showProducts sin ningun parametro de filtro agregado
        */
        else{
            showProducts(url);
        }
    });

    /**
    * Inicializa el Slider Range con los valores minimo y maximo
    * @param {number} priceMin - Precio minimo considerando todos los productos que existen.
    * @param {number} priceMax - Precio maximo considerando todos los productos que existen.
    */
    function startRange(priceMin, priceMax) {
        $("#slider-range").slider({
            range: true,
            /** minimo que admitira el slider */
            min: 0,
            /** maximo que admitira el slider */
            max: priceMax + 10000,
            /** valores seleccionados en el slider al iniciar, son los que vienen de la consulta a la API */
            values: [ priceMin, priceMax ],
            /** Cada vez que se produce un evento del slider modifica el rango seleccionado */
            slide: function( event, ui ) {
                /** Agrega formato al precio minimo y maximo */
                let min = new Intl.NumberFormat("es-CL", {style: "currency", currency: "CLP", minimumFractionDigits: 0}).format(ui.values[ 0 ]);
                let max = new Intl.NumberFormat("es-CL", {style: "currency", currency: "CLP", minimumFractionDigits: 0}).format(ui.values[ 1 ]);
                /** Agrega el rango como texto al contenedor amount */
                $( "#amount" ).val( min + " - " + max );
            }
        });
        
        /*
        * Inicializa los valores en el label del slider-range
        */
        $("#amount").val( function(){
            /** Agrega formato al precio minimo y maximo */
            let min = new Intl.NumberFormat("es-CL", {style: "currency", currency: "CLP", minimumFractionDigits: 0}).format($( "#slider-range" ).slider( "values", 0 ));
            let max = new Intl.NumberFormat("es-CL", {style: "currency", currency: "CLP", minimumFractionDigits: 0}).format($( "#slider-range" ).slider( "values", 1 ));
            /** Agrega el rango como texto al contenedor amount */
            return min + " - " + max; 
        });
    };

    /*
    * Funcion que toma los filtros de categorias y rangos de precios y llama a la api con esos parametros
    */
    $("#btn-filtrar").on("click", function(){
        // Se resetea el ordenamiento
        $("#ordering-select").val('1');
        orderingSelected = $("#ordering-select").val();

        /** Llama a la function filter */
        filter();
    });

    /**
    * Obtiene los valores de los filtros de categorias y rango de precios y los envia showProductsFilter
    */
    function filter(){
        categoriesSelected = new Array();
        /** recorre cada check de categorias que este checkeado */
        $.each($("input[name='categories[]']:checked"), function() {
            /** Agrega el valor del input check a la lista de categorias seleccionadas */
            categoriesSelected.push($(this).val());
        });

        /** Guarda el minimo y maximo seleccionado en el Slider Range */
        priceFilter = {
            min: $("#slider-range").slider("values", 0),
            max: $("#slider-range").slider("values", 1)
        }

        /** Cambia el valor segun la accion actual, ya que será filtro, no busqueda de texto */
        isFilter = true;
        isSearch = false;
        
        /** Envía los filtros a la funcion con los parametros respectivos */
        showProductsFilter(URL_START, {
            categories: categoriesSelected,
            price: priceFilter,
            order: orderingSelected
        });
    }

    /** Funcion que cambia a mayuscula la primera letra del texto a modificar */
    const capitalize = s => s && s[0].toUpperCase() + s.slice(1);

    /**
    * En caso de cambiar la opcion del select de ordenamiento
    * llama a la funcion que consume la API, agregandole el filtro de ordenamiento
    */
    $('#ordering-select').on('change', function() {
        /** Guarda el valor seleccionado del select de ordenamiento */
        orderingSelected = $(this).val();
        /** Llama a la funcion que prepara la llamada a la API, en base a la ultima accion, si fue busqueda de texto o por filtro */
        if(isSearch){
            search();
        }else if(isFilter){
            filter();
        }else{
            showProducts(URL_START);
        }
    });

    /**
     *  Al hacer click en el boton agregar al carrito obtiene el producto en la data del elemento y lo envia a la funcion addToCart
     */
    $(document).on('click', '.add-to-cart', function () {
        /** Obitene el producto que se guardó en la tarjeta del mismo en la galeria */
        let product = JSON.parse(decodeURIComponent($(this).data("product")));
        /** Lo agrega al carrito de compras */
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
    };

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

