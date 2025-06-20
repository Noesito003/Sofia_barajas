// Generar un ID de sesión único para este navegador.
// Este ID persistirá en localStorage para mantener el carrito si se recarga la página.
let sessionId = localStorage.getItem('cremeria_session_id');
if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('cremeria_session_id', sessionId);
}

// Elementos del DOM
const productListDiv = document.getElementById('product-list');
const cartButton = document.getElementById('cart-button');
const cartSidebar = document.getElementById('cart-sidebar');
const closeCartButton = document.getElementById('close-cart-button');
const overlay = document.getElementById('overlay');
const cartCountSpan = document.getElementById('cart-count');
const cartItemsDiv = document.getElementById('cart-items');
const cartSubtotalSpan = document.getElementById('cart-subtotal'); // Nuevo: Subtotal
const cartFinalTotalSpan = document.getElementById('cart-final-total'); // Nuevo: Total Final
const checkoutButton = document.getElementById('checkout-button');
const emptyCartMessage = document.getElementById('empty-cart-message');
const messageModal = document.getElementById('message-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalCloseButton = document.getElementById('modal-close-button');
const userIdDisplay = document.getElementById('user-id-display');
const loadingIndicator = document.getElementById('loading-indicator');

// Nuevos elementos del DOM para descuentos
const discountCodeInput = document.getElementById('discount-code-input');
const applyDiscountButton = document.getElementById('apply-discount-button');
const discountMessage = document.getElementById('discount-message');
const discountAppliedInfo = document.getElementById('discount-applied-info');
const appliedDiscountCodeSpan = document.getElementById('applied-discount-code');
const discountAmountSpan = document.getElementById('discount-amount');
const removeDiscountButton = document.getElementById('remove-discount-button');

// --- Datos de Productos (Hardcodeados en el JavaScript) ---
const products = [
    { id: 1, name: "Queso Oaxaca 1K", description: "Delicioso queso oaxaqueño, perfecto para derretir.", price: 150.00, imageUrl: "/images/productos/asadero.png", categories: ["queso"] },
    { id: 2, name: "Queso de Puerco", description: "Exquisito queso de puerco, ideal para antojitos.", price: 120.00, imageUrl: "/images/productos/carne.png", categories: ["carne", "embutido"] },
    { id: 3, name: "Crema 1K", description: "Crema fresca de rancho, el toque perfecto para tus platillos.", price: 90.00, imageUrl: "/images/productos/crema.png", categories: ["lacteo"] },
    { id: 4, name: "Jamón de Pavo", description: "Saludable y delicioso jamón de pavo, bajo en grasa.", price: 200.00, imageUrl: "/images/productos/jamonC.png", categories: ["carne", "embutido"] },
    { id: 5, name: "Jamón de Pierna", description: "Jamón de pierna de alta calidad, ideal para sándwiches y más.", price: 260.00, imageUrl: "/images/productos/jamon.png", categories: ["carne", "embutido"] },
    { id: 6, name: "Salchichas 1K", description: "Salchichas de la mejor calidad, para tus desayunos o parrilladas.", price: 65.00, imageUrl: "/images/productos/salchichas.png", categories: ["carne", "embutido"] },
    { id: 7, name: "Queso Cotija 1K", description: "Auténtico queso Cotija, ideal para rallar sobre tus platillos.", price: 240.00, imageUrl: "/images/productos/cotija.png", categories: ["queso"] }, // Asegúrate de tener una imagen real
    { id: 8, name: "Queso Fresco 1K", description: "Queso fresco de rancho, suave y cremoso.", price: 150.00, imageUrl: "/images/productos/fresco.png", categories: ["queso", "lacteo"] } // Asegúrate de tener una imagen real
];

// --- Datos de Códigos de Descuento (Hardcodeados) ---
// En una aplicación real, estos vendrían de una base de datos o API.
const discountCodes = {
    "QUESO15": { type: "percentage", value: 0.15, appliesTo: "category", category: "queso", minPurchase: 0, description: "15% de descuento en quesos." },
    "ENVIO500": { type: "free_shipping", value: 0, appliesTo: "cart", minPurchase: 500, description: "Envío gratis en pedidos mayores a $500." },
    "BIENVENIDO": { type: "percentage", value: 0.10, appliesTo: "cart", minPurchase: 0, description: "10% de descuento en tu primera compra." } // No hay un mecanismo para "primera compra" en el frontend sin backend, es solo para demostración.
};

let appliedDiscount = null; // Almacena el código de descuento aplicado actualmente.

// --- Gestión del Carrito (usando localStorage) ---
let cartItems = JSON.parse(localStorage.getItem('cremeria_cart')) || [];
let currentAppliedCode = localStorage.getItem('cremeria_discount_code') || null;

/**
 * Guarda el estado actual del carrito y el código de descuento en localStorage.
 */
function saveCart() {
    localStorage.setItem('cremeria_cart', JSON.stringify(cartItems));
    localStorage.setItem('cremeria_discount_code', currentAppliedCode); // Guardar el código aplicado
}

/**
 * Añade un producto al carrito.
 * @param {number} productId - El ID del producto a añadir.
 */
function addToCart(productId) {
    showLoading(); // Simular carga
    setTimeout(() => { // Simular una operación asíncrona
        const product = products.find(p => p.id === productId);
        if (!product) {
            showMessageModal("Error", "Producto no encontrado.");
            hideLoading();
            return;
        }

        const existingItem = cartItems.find(item => item.id === productId);

        if (existingItem) {
            existingItem.quantity += 1;
            showMessageModal("Producto Añadido", `${product.name} actualizado en el carrito.`);
        } else {
            cartItems.push({
                id: product.id,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
                quantity: 1,
                categories: product.categories || [] // Asegurarse de que tenga categorías
            });
            showMessageModal("Producto Añadido", `${product.name} se añadió al carrito.`);
        }
        saveCart();
        renderCart();
        hideLoading();
    }, 300); // Pequeño retraso para simular una operación
}

/**
 * Actualiza la cantidad de un producto en el carrito.
 * Si la cantidad llega a 0 o menos, el artículo se elimina.
 * @param {number} productId - El ID del producto en el carrito.
 * @param {number} newQuantity - La nueva cantidad.
 */
function updateCartItemQuantity(productId, newQuantity) {
    showLoading(); // Simular carga
    setTimeout(() => { // Simular una operación asíncrona
        const itemIndex = cartItems.findIndex(item => item.id === productId);

        if (itemIndex > -1) {
            if (newQuantity <= 0) {
                cartItems.splice(itemIndex, 1); // Eliminar el artículo
                showMessageModal("Carrito Actualizado", "Producto eliminado del carrito.");
            } else {
                cartItems[itemIndex].quantity = newQuantity;
                showMessageModal("Carrito Actualizado", "Cantidad de producto actualizada.");
            }
        }
        saveCart();
        renderCart();
        hideLoading();
    }, 300);
}

/**
 * Elimina un producto del carrito.
 * @param {number} productId - El ID del producto a eliminar.
 */
function removeCartItem(productId) {
    showLoading(); // Simular carga
    setTimeout(() => { // Simular una operación asíncrona
        const initialLength = cartItems.length;
        cartItems = cartItems.filter(item => item.id !== productId);
        if (cartItems.length < initialLength) {
            showMessageModal("Carrito Actualizado", "Producto eliminado del carrito.");
        }
        saveCart();
        renderCart();
        hideLoading();
    }, 300);
}

/**
 * Calcula el subtotal del carrito sin aplicar descuentos.
 * @returns {number} El subtotal del carrito.
 */
function calculateSubtotal() {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

/**
 * Aplica un código de descuento al carrito.
 * @param {string} code - El código de descuento a aplicar.
 */
function applyDiscountCode(code) {
    showLoading();
    setTimeout(() => {
        const discount = discountCodes[code.toUpperCase()]; // Convertir a mayúsculas para ser insensible a mayúsculas/minúsculas

        if (!discount) {
            discountMessage.textContent = 'Código de descuento inválido.';
            discountMessage.classList.remove('text-green-500');
            discountMessage.classList.add('text-red-500');
            appliedDiscount = null;
            currentAppliedCode = null;
        } else {
            const subtotal = calculateSubtotal();

            if (subtotal < discount.minPurchase) {
                discountMessage.textContent = `Compra mínima de $${discount.minPurchase.toFixed(2)} para aplicar este código.`;
                discountMessage.classList.remove('text-green-500');
                discountMessage.classList.add('text-red-500');
                appliedDiscount = null;
                currentAppliedCode = null;
            } else {
                appliedDiscount = discount;
                currentAppliedCode = code.toUpperCase();
                discountMessage.textContent = `Código "${code.toUpperCase()}" aplicado: ${discount.description}`;
                discountMessage.classList.remove('text-red-500');
                discountMessage.classList.add('text-green-500');
                showMessageModal("Descuento Aplicado", `Se ha aplicado el código "${code.toUpperCase()}".`);
            }
        }
        saveCart();
        renderCart();
        hideLoading();
    }, 500); // Simular un pequeño retraso para la aplicación del descuento
}

/**
 * Remueve el código de descuento aplicado.
 */
function removeDiscount() {
    showLoading();
    setTimeout(() => {
        appliedDiscount = null;
        currentAppliedCode = null;
        discountMessage.textContent = '';
        saveCart();
        renderCart();
        hideLoading();
        showMessageModal("Descuento Eliminado", "El código de descuento ha sido removido.");
    }, 300);
}


// --- Funciones de Utilidad de UI ---

/**
 * Muestra el indicador de carga.
 */
function showLoading() {
    loadingIndicator.classList.add('active');
}

/**
 * Oculta el indicador de carga.
 */
function hideLoading() {
    loadingIndicator.classList.remove('active');
}

/**
 * Muestra un modal de mensaje personalizado.
 * @param {string} title - El título del mensaje.
 * @param {string} message - El contenido del mensaje.
 */
function showMessageModal(title, message) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    messageModal.classList.remove('hidden');
    messageModal.classList.add('flex');
}

/**
 * Oculta el modal de mensaje personalizado.
 */
function hideMessageModal() {
    modalTitle.textContent = ''; // Limpiar título
    modalMessage.textContent = ''; // Limpiar mensaje
    messageModal.classList.add('hidden');
    messageModal.classList.remove('flex');
}

/**
 * Alterna la visibilidad de la barra lateral del carrito de compras.
 */
function toggleCartSidebar() {
    cartSidebar.classList.toggle('open');
    overlay.classList.toggle('open');
}

// --- Funciones de Renderizado ---

/**
 * Renderiza la lista de productos en la página principal.
 */
function renderProducts() {
    productListDiv.innerHTML = ''; // Limpiar productos existentes
    if (products.length === 0) {
        productListDiv.innerHTML = '<p class="text-center text-gray-600 col-span-full">No hay productos disponibles en este momento.</p>';
        return;
    }

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'bg-white rounded-xl shadow-md overflow-hidden product-card';
        productCard.innerHTML = `
            <img src="${product.imageUrl || 'https://placehold.co/400x300/E0F2F7/000000?text=Producto'}" alt="${product.name}" class="w-full h-48 object-cover">
            <div class="p-4">
                <h3 class="text-xl font-semibold text-gray-800 mb-2">${product.name}</h3>
                <p class="text-gray-600 text-sm mb-3">${product.description || 'Delicioso producto lácteo fresco.'}</p>
                <div class="flex justify-between items-center">
                    <span class="text-2xl font-bold text-blue-600">$${product.price.toFixed(2)}</span>
                    <button data-product-id="${product.id}" class="add-to-cart-btn btn-primary px-4 py-2 text-sm rounded-lg flex items-center">
                        <i class="fas fa-cart-plus mr-2"></i> Añadir
                    </button>
                </div>
            </div>
        `;
        productListDiv.appendChild(productCard);
    });

    // Añadir event listeners a los botones "Añadir al Carrito"
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = parseInt(event.currentTarget.dataset.productId);
            addToCart(productId);
        });
    });
}

/**
 * Renderiza los artículos del carrito de compras y calcula los totales.
 */
function renderCart() {
    cartItemsDiv.innerHTML = ''; // Limpiar artículos existentes del carrito
    let subtotal = 0;
    let totalDiscount = 0;
    let finalTotal = 0;
    let hasFreeShipping = false;

    if (cartItems.length === 0) {
        emptyCartMessage.classList.remove('hidden');
        cartItemsDiv.appendChild(emptyCartMessage);
    } else {
        emptyCartMessage.classList.add('hidden');
        cartItems.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;

            const cartItemDiv = document.createElement('div');
            cartItemDiv.className = 'flex items-center space-x-4 bg-gray-50 p-3 rounded-lg shadow-sm';
            cartItemDiv.innerHTML = `
                <img src="${item.imageUrl || 'https://placehold.co/60x60/E0F2F7/000000?text=Item'}" alt="${item.name}" class="w-16 h-16 object-cover rounded-md">
                <div class="flex-grow">
                    <h4 class="font-semibold text-gray-800">${item.name}</h4>
                    <p class="text-gray-600 text-sm">$${item.price.toFixed(2)} c/u</p>
                </div>
                <div class="flex items-center space-x-2">
                    <button data-product-id="${item.id}" data-action="decrease" class="quantity-btn bg-gray-200 text-gray-700 w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-300">-</button>
                    <span class="font-medium">${item.quantity}</span>
                    <button data-product-id="${item.id}" data-action="increase" class="quantity-btn bg-gray-200 text-gray-700 w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-300">+</button>
                </div>
                <button data-product-id="${item.id}" class="remove-from-cart-btn btn-danger text-sm px-2 py-1 rounded-md">
                    <i class="fas fa-trash-alt"></i>
                </button>
            `;
            cartItemsDiv.appendChild(cartItemDiv);
        });
    }

    // Aplicar el descuento si existe y es válido
    if (currentAppliedCode && discountCodes[currentAppliedCode]) {
        appliedDiscount = discountCodes[currentAppliedCode];
        const subtotalForDiscountCheck = calculateSubtotal(); // Usar subtotal para validar

        if (subtotalForDiscountCheck >= appliedDiscount.minPurchase) {
            discountMessage.textContent = `Código "${currentAppliedCode}" aplicado: ${appliedDiscount.description}`;
            discountMessage.classList.remove('text-red-500');
            discountMessage.classList.add('text-green-500');
            discountAppliedInfo.classList.remove('hidden');
            appliedDiscountCodeSpan.textContent = currentAppliedCode;

            if (appliedDiscount.type === "percentage") {
                // Calcular descuento por categoría si aplica
                if (appliedDiscount.appliesTo === "category" && appliedDiscount.category) {
                    const categoryItemsTotal = cartItems.reduce((sum, item) => {
                        if (item.categories && item.categories.includes(appliedDiscount.category)) {
                            return sum + (item.price * item.quantity);
                        }
                        return sum;
                    }, 0);
                    totalDiscount = categoryItemsTotal * appliedDiscount.value;
                } else if (appliedDiscount.appliesTo === "cart") {
                    totalDiscount = subtotal * appliedDiscount.value;
                }
                discountAmountSpan.textContent = `-$${totalDiscount.toFixed(2)}`;
            } else if (appliedDiscount.type === "free_shipping") {
                hasFreeShipping = true;
                totalDiscount = 0; // No hay un descuento monetario directo aquí
                discountAmountSpan.textContent = "Envío Gratis"; // Mensaje especial para envío gratis
            }
        } else {
            // El descuento ya no es válido, removerlo.
            appliedDiscount = null;
            currentAppliedCode = null;
            discountMessage.textContent = 'El código de descuento ya no cumple los requisitos de compra mínima.';
            discountMessage.classList.remove('text-green-500');
            discountMessage.classList.add('text-red-500');
            discountAppliedInfo.classList.add('hidden');
        }
    } else {
        appliedDiscount = null;
        currentAppliedCode = null;
        discountMessage.textContent = '';
        discountAppliedInfo.classList.add('hidden');
    }
    
    finalTotal = subtotal - totalDiscount;
    if (finalTotal < 0) finalTotal = 0; // Asegurarse de que el total no sea negativo

    cartSubtotalSpan.textContent = `$${subtotal.toFixed(2)}`;
    cartFinalTotalSpan.textContent = `$${finalTotal.toFixed(2)}`;
    cartCountSpan.textContent = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    // Añadir event listeners para los botones de cantidad y eliminar
    document.querySelectorAll('.quantity-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = parseInt(event.currentTarget.dataset.productId);
            const action = event.currentTarget.dataset.action;
            const currentItem = cartItems.find(item => item.id === productId);
            if (currentItem) {
                const newQuantity = action === 'increase' ? currentItem.quantity + 1 : currentItem.quantity - 1;
                updateCartItemQuantity(productId, newQuantity);
            }
        });
    });

    document.querySelectorAll('.remove-from-cart-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = parseInt(event.currentTarget.dataset.productId);
            removeCartItem(productId);
        });
    });
}

// --- Event Listeners ---

cartButton.addEventListener('click', toggleCartSidebar);
closeCartButton.addEventListener('click', toggleCartSidebar);
overlay.addEventListener('click', toggleCartSidebar);
modalCloseButton.addEventListener('click', hideMessageModal);

applyDiscountButton.addEventListener('click', () => {
    const code = discountCodeInput.value.trim();
    if (code) {
        applyDiscountCode(code);
    } else {
        discountMessage.textContent = 'Por favor, introduce un código.';
        discountMessage.classList.remove('text-green-500');
        discountMessage.classList.add('text-red-500');
    }
});

removeDiscountButton.addEventListener('click', removeDiscount);

checkoutButton.addEventListener('click', () => {
    if (cartItems.length > 0) {
        showMessageModal("¡Pedido Realizado!", "Gracias por tu compra. Este es un ejemplo solo de frontend; en una tienda real, aquí se procesaría el pago y el pedido.");
        cartItems = []; // Vaciar el carrito después de la "compra"
        appliedDiscount = null; // Quitar descuento
        currentAppliedCode = null; // Quitar el código aplicado
        saveCart();
        renderCart();
    } else {
        showMessageModal("Carrito Vacío", "No tienes productos en tu carrito para proceder al pago.");
    }
});

// --- Configuración Inicial ---
document.addEventListener('DOMContentLoaded', () => {
    userIdDisplay.textContent = `ID de Sesión: ${sessionId.substring(0, 8)}...`; // Mostrar una parte del ID de sesión
    renderProducts(); // Cargar productos al iniciar
    renderCart(); // Cargar carrito al iniciar (desde localStorage)

    // Inicializar Slick Carousel
    $(document).ready(function(){
        $('.slick-carousel').slick({
            dots: true, // Muestra los puntos de navegación
            infinite: true, // Permite el carrusel infinito
            speed: 500, // Velocidad de la transición en milisegundos
            slidesToShow: 1, // Muestra una diapositiva a la vez
            slidesToScroll: 1, // Desplaza una diapositiva a la vez
            autoplay: true, // Autoplay del carrusel
            autoplaySpeed: 3000, // Velocidad del autoplay en milisegundos (3 segundos)
            arrows: false, // Oculta las flechas de navegación (puedes ponerlo en true si las deseas)
        });
    });

    // Añadir smooth scroll a los enlaces de navegación internos
    document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');

            if (targetId === '#' || targetId === '#top') {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            } else {
                document.querySelector(targetId).scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Event listeners para copiar códigos de descuento
    document.querySelectorAll('.copy-code-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const codeToCopy = event.currentTarget.dataset.code;
            navigator.clipboard.writeText(codeToCopy).then(() => {
                showMessageModal("Código Copiado", `El código "${codeToCopy}" ha sido copiado al portapapeles.`);
            }).catch(err => {
                console.error('Error al copiar el texto: ', err);
                showMessageModal("Error", "No se pudo copiar el código automáticamente. Por favor, cópialo manualmente.");
            });
        });
    });
});

// Elementos del DOM para la sección de Contacto
const contactForm = document.getElementById('contact-form');

// --- Event Listeners (adicionales para Contacto) ---
if (contactForm) {
    contactForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevenir el envío real del formulario

        showLoading(); // Simular carga

        setTimeout(() => { // Simular una operación asíncrona
            showMessageModal("¡Mensaje Enviado!", "Gracias por contactarnos. Tu mensaje ha sido recibido y te responderemos a la brevedad.");
            contactForm.reset(); // Limpiar el formulario después de "enviar"
            hideLoading();
        }, 800); // Pequeño retraso para simular el envío
    });
}