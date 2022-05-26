"use strict";

// Utilities

function debounce(func, delay) {
  let timeOutId;
  return (...args) => {
    if (timeOutId) {
      clearTimeout(timeOutId);
    }
    timeOutId = setTimeout(() => func.apply(null, args), delay);
  };
}

//Autocomplete

function createAutoComplete({
  root,
  renderOption,
  onOptionSelect,
  inputValue,
  fetchData,
}) {
  root.innerHTML = `
        <lavel><b>Search</b></label>
        <input type="text" class="input"/>
        <div class="dropdown">
            <div class="dropdown-menu">
              <div class="dropdown-content results"></div>
            </div>
        </div>
    `;

  const input = root.querySelector("input");
  const dropdown = root.querySelector(".dropdown");
  const resultsWrapper = root.querySelector(".results");

  // You can find debounce function in utilities which is used in addEvent
  //Listener below

  async function onInput(event) {
    const Items = await fetchData(event.target.value);

    if (!Items.length) {
      dropdown.classList.remove("is-active");
      return;
    }

    resultsWrapper.innerHTML = "";
    dropdown.classList.add("is-active");

    for (let item of Items) {
      const option = document.createElement("a");

      option.classList.add("dropdown-item");
      option.innerHTML = renderOption(item);

      option.addEventListener("click", function () {
        dropdown.classList.remove("is-active");
        input.value = inputValue(item);
        onOptionSelect(item);
      });

      resultsWrapper.appendChild(option);
    }
  }

  input.addEventListener("input", debounce(onInput, 500));

  // closing the data which comes after searching for the movie

  document.addEventListener("click", function (e) {
    if (!root.contains(e.target)) {
      dropdown.classList.remove("is-active");
    }
  });
}

//

const autocompleteConfig = {
  renderOption(movie) {
    const imgSrc = movie.Poster === "N/A" ? "" : movie.Poster;
    return `
            <img src="${imgSrc}"/>
            ${movie.Title} (${movie.Year})
        `;
  },

  inputValue(movie) {
    return movie.Title;
  },

  async fetchData(searchTerm) {
    const response = await axios.get("https://www.omdbapi.com", {
      params: {
        apikey: "5d74adf5",
        s: searchTerm,
      },
    });

    if (response.data.Error) {
      return [];
    }

    return response.data.Search;
  },
};

createAutoComplete({
  ...autocompleteConfig,
  root: document.querySelector("#left-autocomplete"),
  onOptionSelect(movie) {
    document.querySelector(".tutorial").classList.add("is-hidden");
    onMovieSelect(movie, document.querySelector("#left-summary"), "left");
  },
});

createAutoComplete({
  ...autocompleteConfig,
  root: document.querySelector("#right-autocomplete"),
  onOptionSelect(movie) {
    document.querySelector(".tutorial").classList.add("is-hidden");
    onMovieSelect(movie, document.querySelector("#right-summary"), "right");
  },
});

let leftMovie;
let rightmovie;

async function onMovieSelect(movie, summaryElement, side) {
  const response = await axios.get("https://www.omdbapi.com", {
    params: {
      apikey: "5d74adf5",
      i: movie.imdbID,
    },
  });

  summaryElement.innerHTML = movieTemplate(response.data);

  if (side === "left") {
    leftMovie = response.data;
  } else {
    rightmovie = response.data;
  }

  if (leftMovie && rightmovie) {
    runComparison();
  }
}

function runComparison() {
  const leftSidesStats = document.querySelectorAll(
    "#left-summary .notification"
  );

  const rightSidesStats = document.querySelectorAll(
    "#right-summary .notification"
  );

  leftSidesStats.forEach((leftStat, index) => {
    const rightStat = rightSidesStats[index];

    const leftSideValue = parseInt(leftStat.dataset.value);
    const rightSideValue = parseInt(rightStat.dataset.value);

    if (rightSideValue > leftSideValue) {
      leftStat.classList.remove("is-primary");
      leftStat.classList.add("is-warning");
    } else {
      rightStat.classList.remove("is-primary");
      rightStat.classList.add("is-warning");
    }
  });
}

function movieTemplate(movieDetail) {
  const dollars = parseInt(
    movieDetail.BoxOffice.replace("$", "").replace(",", "")
  );
  const metascore = parseInt(movieDetail.Metascore);
  const imdbScore = parseInt(movieDetail.imdbRating.replace(".", ""));
  const imdbVotes = parseInt(movieDetail.imdbVotes.replaceAll(",", ""));

  const awards = movieDetail.Awards.split(" ").reduce((prev, word) => {
    const value = parseInt(word);

    if (isNaN(value)) {
      return prev;
    } else {
      return prev + value;
    }
  }, 0);

  return `
    <article class="media">
        <figure class="media-left">
            <P class="image">
                <img src="${movieDetail.Poster}" />
            </p>
        </figure>
        <div class="media-content">
            <div class="content">
                <h1>${movieDetail.Title}</h1>
                <h4>${movieDetail.Title}</h4>
                <p>${movieDetail.Plot}</p>
            </div>
        </div>
    </article>

    <article data-value=${awards} class="notification is-primary">
        <p class="title">${movieDetail.Awards}</p>
        <p class="subtitle">Awards</p>
    </article>
    <article data-value=${dollars} class="notification is-primary">
        <p class="title">${movieDetail.BoxOffice}</p>
        <p class="subtitle">Box Office</p>
    </article>
    <article data-value=${metascore} class="notification is-primary">
        <p class="title">${movieDetail.Metascore}</p>
        <p class="subtitle">Metascore</p>
    </article>
    <article data-value=${imdbScore} class="notification is-primary">
        <p class="title">${movieDetail.imdbRating}</p>
        <p class="subtitle">IMDB Rating</p>
    </article>
    <article data-value=${imdbVotes} class="notification is-primary">
        <p class="title">${movieDetail.imdbVotes}</p>
        <p class="subtitle">IMDB Votes</p>
    </article>
`;
}
