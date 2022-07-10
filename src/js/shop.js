$( document ).ready(function() {
    const DOMAIN = "https://fierce-woodland-71648.herokuapp.com";
    const URL_START = `${DOMAIN}/api/products`;
    let isSearch = false;
    let isFilter = false;
    let searchText = '';
    let categoriesSelected = [];
    let priceFilter = {};
    let orderingSelected = 1;

    updateCart();

    if (window.location.href.indexOf("?q=") > -1) {
        searchText = getParameterValue("q");
        $("#search").val(searchText);

        // Se resetea el ordenamiento
        if(isFilter){
            $("#ordering-select").val('1');
            orderingSelected = $("#ordering-select").val();
        }

        let url = `${DOMAIN}/api/search`;
        isSearch = true;
        isFilter = false;
        showProducts(url, searchText, true);
    }else{
        // Se buscan las categorias y los productos al iniciar la pagina
        showProducts(URL_START, null, true);
    }

    function getParameterValue(name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    };

    /*
    * Funcion que consume la api y obtiene los resultados paginados
    */
    function showProducts(url, search = null, start = null){
        let request = {
            url: url,
            method: 'GET',
            data: {
                q: search,
                s: start,
                o: orderingSelected
            },
            beforeSend: function () {
                $('.modal_loading').modal('show');
            },
            complete: function(){
                setTimeout(function(){
                    $('.modal_loading').modal('hide');
                }, 500);
            },
            success: function(response) {
                // Se procede a llamar a la funcion que agrega la paginacion
                if(start){
                    showCategories(response.data2);
                    startRange(response.data3[0].min, response.data3[0].max);
                    start = false;
                }

                fillGrid(response.data.data);
                pagination(response.data.links);
            },
            error: function (request, status, error) {
                Swal.fire(
                  'Error!',
                  'Ha ocurrido un error interno, por favor intente más tarde',
                  'error'
                );
            }
        };

        $.ajax(request);
    };

    function showProductsFilter(url, options = null){
        let request = {
            url: url,
            method: 'POST',
            data: {
                options: options
            },
            beforeSend: function () {
                $('.modal_loading').modal('show');
            },
            complete: function(){
                setTimeout(function(){
                    $('.modal_loading').modal('hide');
                }, 500);
            },
            success: function(response) {
                // Se llama a la funcion que dibuja las tarjetas de productos
                fillGrid(response.data.data);
                // Se procede a llamar a la funcion que agrega la paginacion
                pagination(response.data.links);
            },
            error: function (request, status, error) {
                Swal.fire(
                  'Error!',
                  'Ha ocurrido un error interno, por favor intente más tarde',
                  'error'
                );
            }
        };

        $.ajax(request);
    };

    function fillGrid(products){
        $('#gallery-products').empty();
        // Se agregan los productos como grilla en el DOM, con la informacion y el botón de agregar al carrito
        products.map((product) => {
            let price = '';
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

    function showCategories(categories){
        categories.map((category, index) => {
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

    /*
    * Se agregan los elementos para la paginacion en el DOM según la cantidad de paginas sean  con sus respectivos enlaces a la api
    */
    function pagination(links){
        $('#pagination').empty();
        links.map((link, i) => {
            link = link.replace('http', 'https');
            if(i==0){
                $('#pagination').append(`
                    <li class="page-item ${!link.url ? 'disabled' : ''}">
                        <a class="page-link" href="${link.url}" tabindex="-1" aria-disabled="${link.url ? false : true}"><<</a>
                    </li>
                `);
            }else if(i==links.length - 1){
                $('#pagination').append(`
                    <li class="page-item ${!link.url ? 'disabled' : ''}">
                        <a class="page-link" href="${link.url}" aria-disabled="${link.url ? false : true}">>></a>
                    </li>
                `);
            }else{
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

    function search(){
        // Se resetea el ordenamiento
        if(isFilter){
            $("#ordering-select").val('1');
            orderingSelected = $("#ordering-select").val();
        }

        searchText = $("#search").val();
        let url = `${DOMAIN}/api/search`;
        isSearch = true;
        isFilter = false;
        showProducts(url, searchText);
    }

    /*
    * Al hacer click en la paginacion se llama a la funcion que consume la api y obtiene los productos
    * si isSearch es true, entonces se agrega el texto a buscar
    */
    $("body").on("click", '.pagination a', function(e){
        e.preventDefault();
        let url = $(this).attr('href');
        if(isSearch){
            showProducts(url, searchText);
        }else if(isFilter){
            showProductsFilter(url, {
                categories: categoriesSelected,
                price: priceFilter,
                order: orderingSelected
            });
        }else{
            showProducts(url);
        }
    });

    // Inicializa el Slider Range con los valores minimo y maximo
    function startRange(priceMin, priceMax) {
        $("#slider-range").slider({
            range: true,
            min: 0,
            max: priceMax + 10000,
            values: [ priceMin, priceMax ],
            slide: function( event, ui ) {
                let min = new Intl.NumberFormat("es-CL", {style: "currency", currency: "CLP", minimumFractionDigits: 0}).format(ui.values[ 0 ]);
                let max = new Intl.NumberFormat("es-CL", {style: "currency", currency: "CLP", minimumFractionDigits: 0}).format(ui.values[ 1 ]);
                $( "#amount" ).val( min + " - " + max );
            }
        });
        
        /*
        * Inicializa los valores en el label del slider-range
        */
        $("#amount").val( function(){
            let min = new Intl.NumberFormat("es-CL", {style: "currency", currency: "CLP", minimumFractionDigits: 0}).format($( "#slider-range" ).slider( "values", 0 ));
            let max = new Intl.NumberFormat("es-CL", {style: "currency", currency: "CLP", minimumFractionDigits: 0}).format($( "#slider-range" ).slider( "values", 1 ));
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

        filter();
    });

    function filter(){
        categoriesSelected = new Array();
        $.each($("input[name='categories[]']:checked"), function() {
            categoriesSelected.push($(this).val());
        });

        priceFilter = {
            min: $("#slider-range").slider("values", 0),
            max: $("#slider-range").slider("values", 1)
        }

        isFilter = true;
        isSearch = false;
        
        showProductsFilter(URL_START, {
            categories: categoriesSelected,
            price: priceFilter,
            order: orderingSelected
        });
    }

    const capitalize = s => s && s[0].toUpperCase() + s.slice(1);

    $('#ordering-select').on('change', function() {
        orderingSelected = $(this).val();
        if(isSearch){
            search();
        }else if(isFilter){
            filter();
        }else{
            showProducts(URL_START);
        }
    });

    // Al hacer click en el boton agregar al carrito obtiene el producto en la data del elemento y lo envia a la funcion addToCart
    $(document).on('click', '.add-to-cart', function () {
        let product = JSON.parse(decodeURIComponent($(this).data("product")));
        addToCart(product);
    });

    function addToCart(product) {
        if(localStorage.getItem('bsale_cart') == null){
            let cart = [];
            localStorage.setItem('bsale_cart', JSON.stringify(cart))
        }

        let cart = JSON.parse(localStorage.getItem('bsale_cart'))
        product.quantity = 1;
        let productFound = cart.filter(cart => cart.id == product.id);
        
        if(productFound.length == 0){
            cart.push(product)
        }else{
            cart.map(cart => {
                if(cart.id == product.id){
                    cart.quantity++;
                }
            });
        }
        localStorage.setItem('bsale_cart', JSON.stringify(cart))

        // Actualiza el contador del carrito
        updateCart();
    };

    function updateCart(){
        if(localStorage.getItem('bsale_cart') == null){
            let cart = [];
            localStorage.setItem('bsale_cart', JSON.stringify(cart))
        }

        let cart = JSON.parse(localStorage.getItem('bsale_cart'));

        $("#cart-counter").text(cart.length);
    }

    $("#cart-button").on("click", function(){
        drawCart();
    });

    function drawCart(){
        let cart = JSON.parse(localStorage.getItem('bsale_cart'));
        $("#cart-container").empty();
        let total = 0;
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
            total += ((product.price - (product.price*product.discount) / 100)) * product.quantity;
        });
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

    $(document).on('click', '.button-min', function () {
        let productId = $(this).data("id");
        let cart = JSON.parse(localStorage.getItem('bsale_cart'));
        let total = 0;
        cart.map(product => {
            if(product.id == productId && product.quantity > 1){
                product.quantity--;
                $(`#qty-${product.id}`).val(product.quantity);
                $(`#total-price-${product.id}`).text(`${new Intl.NumberFormat("es-CL", {style: "currency", currency: "CLP", minimumFractionDigits: 0}).format(((product.price - (product.price*product.discount) / 100)) * product.quantity) } CLP`);
            }
            total += ((product.price - (product.price*product.discount) / 100)) * product.quantity;
        });
        $("#total").text(`${ new Intl.NumberFormat("es-CL", {style: "currency", currency: "CLP", minimumFractionDigits: 0}).format(total) } CLP`);
        localStorage.setItem('bsale_cart', JSON.stringify(cart));
    });


    $(document).on('click', '.button-plus', function () {
        let productId = $(this).data("id");
        let cart = JSON.parse(localStorage.getItem('bsale_cart'))
        let total = 0;
        cart.map(product => {
            if(product.id == productId && product.quantity < 10){
                product.quantity++;
                $(`#qty-${product.id}`).val(product.quantity);
                $(`#total-price-${product.id}`).text(`${new Intl.NumberFormat("es-CL", {style: "currency", currency: "CLP", minimumFractionDigits: 0}).format(((product.price - (product.price*product.discount) / 100)) * product.quantity) } CLP`);
            }
            total += ((product.price - (product.price*product.discount) / 100)) * product.quantity;
        });
        $("#total").text(`${ new Intl.NumberFormat("es-CL", {style: "currency", currency: "CLP", minimumFractionDigits: 0}).format(total) } CLP`);
        localStorage.setItem('bsale_cart', JSON.stringify(cart));
    });

    $(document).on('click', '.remove', function () {
        let productId = $(this).data("id");
        let cart = JSON.parse(localStorage.getItem('bsale_cart'));

        let newCart = cart.filter(product => product.id !== productId);

        localStorage.setItem('bsale_cart', JSON.stringify(newCart));

        $("#cart-counter").text(newCart.length);

        drawCart();
    });

});

