$( document ).ready(function() {
    showProducts();
    function showProducts(){
        $.ajax({
            url: "http://127.0.0.1:8000/api/products",
            data: {},
            beforeSend: function () {
                $('.modal_loading').modal('show');
            },
            complete: function(){
                setTimeout(function(){
                    $('.modal_loading').modal('hide');
                }, 500);
            },
            success: function(response) {
                $('#gallery-products').empty();
                response.map((product) => {
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
                                    <div class="text-center"><a class="btn btn-outline-dark mt-auto" href="#">View options</a></div>
                                    <div class="text-center"><a class="btn btn-outline-dark mt-auto" href="#">+ <i class="bi-cart-fill me-1"></i></a></div>
                                </div>
                            </div>
                        </div>
                    `);
                });
            },
            error: function (request, status, error) {
                Swal.fire(
                  'Error!',
                  'Ha ocurrido un error interno, por favor intente más tarde',
                  'error'
                );
            }
        });
    };

    $('#btn-search').on('click', function(){
        let search = $("#search").val();
        $.ajax({
            url: "http://127.0.0.1:8000/api/search",
            method: 'POST',
            data: {
                q: search
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
                $('#gallery-products').empty();
                response.map((product) => {
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
                                    <div class="text-center"><a class="btn btn-outline-dark mt-auto" href="#">View options</a></div>
                                    <div class="text-center"><a class="btn btn-outline-dark mt-auto" href="#">+ <i class="bi-cart-fill me-1"></i></a></div>
                                </div>
                            </div>
                        </div>
                    `);
                });
            },
            error: function (request, status, error) {
                Swal.fire(
                  'Error!',
                  'Ha ocurrido un error interno, por favor intente más tarde',
                  'error'
                );
            }
        });
    });
});

