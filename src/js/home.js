$( document ).ready(function() {
    const DOMAIN = "https://fierce-woodland-71648.herokuapp.com";
    const URL_START = `${DOMAIN}/api/some`;
    const QUANTITY = 6;
    
    showProducts(URL_START, QUANTITY);

    updateCart();

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
                            <div class="text-center"><a class="btn btn-outline-dark mt-auto add-to-cart" data-product="${encodeURIComponent(JSON.stringify(product))}" style="border-radius: 5px" href="#"><i class="bi-cart-plus-fill" style="font-size: 1.5rem;"></i> Agregar al Carrito</a></div>
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
        window.location.replace(`https://pacific-river-42460.herokuapp.com/src/shop.html?q=${$('#search').val()}`);
    });

    // En caso de que al escribir en el buscador presione la tecla enter
    $('#search').keyup(function(e){
        if(e.keyCode == 13)
            window.location.replace(`https://pacific-river-42460.herokuapp.com/src/shop.html?q=${$(this).val()}`);
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

