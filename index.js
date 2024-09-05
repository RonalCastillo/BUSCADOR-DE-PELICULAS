const API_KEY = 'MI_API_KEY';
// Función para obtener los géneros de la API
async function obtenerGeneros() {

    const gnr = `https://api.themoviedb.org/3/genre/movie/list?api_key=${API_KEY}&language=es-ES`;

    try {
        const response = await fetch(gnr);
        if (!response.ok) {
            throw new Error('Error en la solicitud');
        }
        const data = await response.json();
        genresList = data.genres; // Guarda la lista de géneros



    } catch (error) {
        console.error('Error al obtener los géneros:', error);
    }
}

// Llamar a la función para obtener los géneros
obtenerGeneros();


async function buscarDatos(url) {
    try {
        const respuesta = await fetch(url);
        const datos = await respuesta.json();
        return datos;


    } catch (error) {
        console.error('Error al obtener los datos:', error);
    }
}

// Función para obtener los detalles de una película, incluyendo la duración
async function obtenerDetallesPelicula(movieId) {

    const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&language=es-ES`;
    const creditsUrl = `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${API_KEY}&language=es-ES`;

    try {
        const [movieResponse, creditsResponse] = await Promise.all([fetch(url), fetch(creditsUrl)]);

        if (!movieResponse.ok || !creditsResponse.ok) {
            throw new Error('Error al obtener los detalles de la película');
        }

        const movieData = await movieResponse.json();
        const creditsData = await creditsResponse.json();

        // Buscar el director en los créditos
        const director = creditsData.crew.find(person => person.job === 'Director');

        return {
            ...movieData,
            director: director ? director.name : 'Desconocido'
        };
    } catch (error) {
        console.error('Error al obtener los detalles de la película:', error);
        return {};
    }
}
// Función para cargar las películas
async function buscarPeliculas(busca) {
    const cont = document.getElementById('help');
    const bus = document.getElementById('buscar');

    const url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=es-ES&query=${busca}`;
    const movies = await buscarDatos(url);

    // Aquí se añade la solicitud para obtener la duración de cada película
    const peliculasConDetalles = await Promise.all(movies.results.map(async (movie) => {
        const detalles = await obtenerDetallesPelicula(movie.id);
        return {
            ...movie,
            runtime: detalles.runtime,
            director: detalles.director
        };
    }));
    mostrarPeiculas(peliculasConDetalles);

    //contador de peliculas 
    let count = Object.keys(movies.results).length
    const texto = (bus.value);
    let help = document.querySelector('.help-text');
    if (help) {
        // Si existe, reemplaza el contenido
        help.textContent = count + ' Resultados para: ' + texto;
        if (count >= 20) {
            help.textContent = 'Mas de ' + count + ' Resultados para: ' + texto;

        }


    } else {
        // Si no existe, crea un nuevo elemento <p>
        help = document.createElement('P');
        help.classList.add('help-text');
        //  help.textContent = count + ' Resultados encontrados ' + texto;
        cont.appendChild(help);
    }


}

// Función para mostrar las películas en la página
function mostrarPeiculas(movies) {

    const content = document.getElementById('list_pelis');

    content.innerHTML = '';  // Limpiar el contenido existente

    if (movies.length === 0) {
        alertas.textContent = "No hay datos para esta busqueda";
        err.append(alertas);
        removAlert();
    } else {
        movies.forEach(movie => {

            const miFecha = convertirFecha(movie.release_date);
            const movieCard = document.createElement('DIV');
            movieCard.classList.add('peli-card');
            movieCard.textContent = movie.title;

            //convierte minutos de entrada a formato de hora y minutos
            const tme = (min) => {
                let horas = Math.floor(min / 60);
                let minutos = Math.floor((min % 60));

                return `${horas}h y ${minutos}m`;
            }
            const moviePoster = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
            const genreNames = movie.genre_ids.map(id => {
                const genre = genresList.find(g => g.id === id);
                return genre ? genre.name : 'Unknown';
            }).join(', ');

            movieCard.innerHTML = `
        <img src="${moviePoster}"loading="lazy" alt="${movie.title}">
        <div class="contenido">
            <h2  class="titulo">${movie.title}</h2>
            <p id="text" class="descripcion">${movie.overview}</p>
            <p class="autor">Director: ${movie.director || 'Desconocido'}</p>
           <p class="duracion">Duración: ${tme(movie.runtime)}</p>
      
               <p class="genero">Género: ${genreNames}</p>
            <p class="fecha">Fecha estreno: ${miFecha}</p>
        </div>
    `;
            content.appendChild(movieCard);
        });

    }
}


// Asignar eventos a los enlaces

buscarPeliculas('ava');


document.getElementById('populares-link').addEventListener('click', async (event) => {
    event.preventDefault();

    try {
        const popular = await buscarDatos(`https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=es-ES&page=1`);


        // Procesar las películas para obtener detalles adicionales
        const peliculasConDetalles = await Promise.all(popular.results.map(async (movie) => {
            const detalles = await obtenerDetallesPelicula(movie.id);
            return {
                ...movie,
                runtime: detalles.runtime,
                director: detalles.director
            };
        }));

        // Mostrar las películas
        mostrarPeiculas(peliculasConDetalles);

    } catch (error) {
        console.error('Error al obtener las películas populares:', error);
    }

    resetInp();
});


document.getElementById('proximo-link').addEventListener('click', async (event) => {
    event.preventDefault();

    try {
        // Obtener las películas que están en cartelera
        const proximo = await buscarDatos(`https://api.themoviedb.org/3/movie/upcoming?api_key=${API_KEY}&language=es-ES&page=1`);


        // Procesar las películas para obtener detalles adicionales
        const peliculasConDetalles = await Promise.all(proximo.results.map(async (movie) => {
            const detalles = await obtenerDetallesPelicula(movie.id);
            return {
                ...movie,
                runtime: detalles.runtime,
                director: detalles.director
            };
        }));

        // Mostrar las películas
        mostrarPeiculas(peliculasConDetalles);

    } catch (error) {
        console.error('Error al obtener las películas en cartelera:', error);
    }

    resetInp();
});


document.getElementById('cartelera-link').addEventListener('click', async (event) => {
    event.preventDefault();

    try {
        // Obtener las películas que están en cartelera
        const carteleraData = await buscarDatos(`https://api.themoviedb.org/3/movie/now_playing?api_key=${API_KEY}&language=es-ES&page=1`);

        // Procesar las películas para obtener detalles adicionales
        const peliculasConDetalles = await Promise.all(carteleraData.results.map(async (movie) => {
            const detalles = await obtenerDetallesPelicula(movie.id);
            return {
                ...movie,
                runtime: detalles.runtime,
                director: detalles.director
            };
        }));

        // Mostrar las películas
        mostrarPeiculas(peliculasConDetalles);

    } catch (error) {
        console.error('Error al obtener las películas en cartelera:', error);
    }

    resetInp();
});



//fn cortas
const err = document.querySelector('.alerta');

const alertas = document.createElement('SPAN');
alertas.classList.add('alert');

//convertir fecha a un formato local
const convertirFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    // Formato de fecha en español (día/mes/año)
    return fecha.toLocaleDateString('es-ES', {

        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};


function buscarImp() {

    const btnBuscar = document.getElementById('buscarBoton');
    const inpBuscar = document.getElementById('buscar');

    btnBuscar.addEventListener('click', () => {
        const busca = inpBuscar.value.trim();

        if (busca.trim() === "") {
            alertas.textContent = "Por favor, ingrese el nombre de la pelicula";
            err.appendChild(alertas);
            removAlert();


        } else {
            buscarPeliculas(busca);
        }
        limpiarSugerencias();
    });
}


buscarImp();

document.getElementById('buscar').addEventListener('input', async function () {

    const query = this.value.trim();


    if (query.length > 0) {

        const url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=es-ES&query=${query}`;


        try {
            const datos = await buscarDatos(url);
            mostrarSugerencias(datos.results);
        } catch (error) {
            console.error('error al obtener las sugerencias', error);
        }
    } else {
        limpiarSugerencias();


    }

})

function mostrarSugerencias(peliculas) {

    const sugerencias = document.getElementById('sugerencias');
    // Verificar si el dispositivo es grande (ancho mayor a 768px)
    const esPantallaGranD = window.matchMedia('(min-width: 700px)').matches;

    if (!esPantallaGranD) {
        // No ejecutar en dispositivos móviles
        return;
    } else {

        sugerencias.innerHTML = '';
        peliculas.forEach(pelicula => {
            const li = document.createElement('LI');
            li.textContent = pelicula.title;
            //console.log(pelicula.title);
            li.classList.add('sugerencias-li');

            li.addEventListener('click', function () {

                document.getElementById('buscar').value = pelicula.title;
                buscarImp();
                limpiarSugerencias();
            });

            sugerencias.appendChild(li);
        });
    }



}
function limpiarSugerencias() {
    const sugerencias = document.getElementById('sugerencias');
    sugerencias.innerHTML = '';  // Limpiar todas las sugerencias
}
function resetInp() {
    const bus = document.getElementById('buscar');
    bus.value = '';

    let help = document.querySelector('.help-text');

    help.textContent = '';

}



// Obtener todos los enlaces del menú
const links = document.querySelectorAll('nav a');

// Añadir evento de clic a cada enlace
links.forEach(link => {
    link.addEventListener('click', function () {
        // Remover la clase 'active' de todos los enlaces
        links.forEach(link => link.classList.remove('active'));

        // Añadir la clase 'active' al enlace que fue clickeado
        this.classList.add('active');
    });
});


const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('nav');

menuToggle.addEventListener('click', () => {
    nav.classList.toggle('active');
});


function removAlert() {
    setTimeout(() => {
        err.removeChild(alertas);
    }, 3000);

}