$( document ).ready(function() {
    const DOMAIN = "http://127.0.0.1:8000";
    const URL_START = `${DOMAIN}/api/products`;
    let isSearch = false;
    let isFilter = false;
    let searchText = '';
    let categoriesSelected = [];
    let priceFilter = {};
    let orderingSelected = 1;

    // Se buscan las categorias y los productos al iniciar la pagina
    showProducts(URL_START, null, true);

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
                if(start)
                    showCategories(response.data2);
                    startRange(response.data3[0].min, response.data3[0].max);
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
                        <img class="card-img-top h-100" src="${product.url_image ? product.url_image : "https://dummyimage.com/450x300/b0b0b0/dbdbdb.jpg&text=BSALE"}" />
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
                            <div class="text-end"><a class="btn btn-outline-dark mt-auto" style="border-radius: 50%" href="#"><i class="bi-cart-plus-fill" style="font-size: 1.5rem;"></i></a></div>
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
});

