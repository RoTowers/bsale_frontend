$( document ).ready(function() {
    const DOMAIN = "http://127.0.0.1:8000";
    const URL_START = `${DOMAIN}/api/some`;
    const QUANTITY = 6;
    
    showProducts(URL_START, QUANTITY);

    /*
    * Funcion que consume la api y obtiene los resultados
    */
    function showProducts(url, quantity = null){
        let request = {
            url: url,
            method: 'GET',
            data: {
                quantity: quantity
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
                fillGrid(response.data);
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
                            <div class="text-end"><a class="btn btn-outline-dark mt-auto" style="border-radius: 50%" href="#"><i class="bi-cart-plus-fill" style="font-size: 1.5rem;"></i></a></div>
                        </div>
                    </div>
                </div>
            `);
        });
    }

    /*
    * Al hacer click en el botón search se llama a la funcion showProducts con la url para realizar la busqueda y con el texto a buscar
    * Se deja isSearch como true para que al clickear la paginacion la funcion sepa que debe agregar el texto a buscar
    */
    $('#btn-search').on('click', function(){
        window.location.replace(`./shop.html?q=${$('#search').val()}`);
    });

    // En caso de que al escribir en el buscador presione la tecla enter
    $('#search').keyup(function(e){
        if(e.keyCode == 13)
            window.location.replace(`./shop.html?q=${$(this).val()}`);
    });
});

