$( document ).ready(function() {
    const URL_START = "http://127.0.0.1:8000/api/products";
    let isSearch = false;
    let searchText = '';

    // Se buscan las categorias y los productos al iniciar la pagina
    showProducts(URL_START, null, true);

    /*
    * Funcion que consume la api y obtiene los resultados paginados
    */
    function showProducts(url, search = null, start = null, options = null){
        console.log(options);
        let request = {
            url: url,
            method: 'GET',
            data: {
                q: search,
                s: start,
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
                // Se procede a llamar a la funcion que agrega la paginacion
                if(start)
                    showCategories(response.data2);
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

        /* if(!search){
            delete request.data;
        } */

        $.ajax(request);
    };

    function fillGrid(products){
        $('#gallery-products').empty();
        // Se agregan los productos como grilla en el DOM, con la informacion y el botón de agregar al carrito
        products.map((product) => {
            $('#gallery-products').append(`
                <div class="col mb-5">
                    <div class="card h-100">
                        <!-- Product image-->
                        <img class="card-img-top" src="${product.url_image}" alt="https://dummyimage.com/450x300/404040/dbdbdb.jpg&text=BSALE" />
                        <!-- Product details-->
                        <div class="card-body p-4">
                            <div class="text-center">
                                <!-- Product name-->
                                <h5 class="fw-bolder">${product.name}</h5>
                                <!-- Product price-->
                                ${product.price} / ${product.price * product.discount}
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
                        <input class="form-check-input" type="checkbox" name="categories[]" value="" id="filter${index + 1}">
                        <label class="form-check-label" for="filter${index + 1}"> ${category.name} </label>
                    </div>
                    <span>${category.count}</span>
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
                    <li class="page-item">
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
    $('#btn-search').on('click', function(){
        searchText = $("#search").val();
        let url = "http://127.0.0.1:8000/api/search";
        isSearch = true;
        showProducts(url, searchText);
    });

    /*
    * Al hacer click en la paginacion se llama a la funcion que consume la api y obtiene los productos
    * si isSearch es true, entonces se agrega el texto a buscar
    */
    $("body").on("click", '.pagination a', function(e){
        e.preventDefault();
        let url = $(this).attr('href');
        if(isSearch){
            showProducts(url, searchText);
        }else{
            showProducts(url);
        }
    });

    $("#slider-range").slider({
        range: true,
        min: 0,
        max: 50000,
        values: [ 0, 50000 ],
        slide: function( event, ui ) {
          $( "#amount" ).val( "$" + ui.values[ 0 ] + " - $" + ui.values[ 1 ] );
        }
    });
    
    /*
    * Inicializa los valores en el label del slider-range
    */
    $("#amount").val( "$" + $( "#slider-range" ).slider( "values", 0 ) +
        " - $" + $( "#slider-range" ).slider( "values", 1 ) );

    $("#btn-filtrar").on("click", function(){
        showProducts(URL_START, null, null, {
            categories: $("input[name=categories]").val()
        });
    });
});

