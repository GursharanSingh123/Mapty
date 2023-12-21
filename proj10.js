'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const buton = document.querySelector('.btn');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10); //just for practice in realtime we dont use time to create id...
  constructor(distance, duration, coords) {
    this.distance = distance; //in km
    this.duration = duration; //in min
    this.coords = coords; //array of lat and lng
  }
  _setDescription() {
    let type = this.name[0].toUpperCase() + this.name.slice(1);
    const options = {
      day: 'numeric',
      month: 'long',
    };
    const formatdate = new Intl.DateTimeFormat(
      navigator.language,
      options
    ).format(this.date);
    this.discription = `${type} on ${formatdate}`;
  }
}

class Running extends Workout {
  name = 'running';
  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  name = 'cycling';
  constructor(distance, duration, coords, elevationGain) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return;
  }
}

// ARCHITECTURE/////
/////////////////////
class App {
  #map;
  #mapZoom = 13;
  #mapEvent;
  #workouts = [];
  constructor() {
    this._getPosition();
    this._getLocalStorage();
    form.addEventListener('submit', this._newWorkout.bind(this));

    inputType.addEventListener('change', this._toggleElevationField.bind(this));
    // console.log(inputType.value);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    buton.addEventListener('click', this.reset);
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Location cannot be retrieved!');
        }
      );
  }
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coor = [latitude, longitude];
    // console.log(position);
    this.#map = L.map('map').setView(coor, this.#mapZoom);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    // console.log(map);
    this.#map.on('click', this._showForm.bind(this));
    this.#workouts.forEach(work => this._renderMarker(work));
  }
  _showForm(inp) {
    form.classList.remove('hidden');
    inputDistance.focus();
    // console.log(inputType.value);
    this.#mapEvent = inp;
    // console.log(inp, this.#mapEvent);
    document.querySelector('.form__btn').style.display = 'block';
  }
  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _newWorkout(e) {
    const conditionChecker = (...values) =>
      values.every(inp => Number.isFinite(inp));
    const positiveChecker = (...values) => values.every(inp => inp > 0);
    e.preventDefault();
    // get data from form
    const { lat, lng } = this.#mapEvent.latlng;
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let workout;
    // check if data is valid
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !conditionChecker(cadence, distance, duration) ||
        !positiveChecker(cadence, distance, duration)
      )
        // if workout running create running object
        return alert('Entry fields must have positive numbers!!');
      workout = new Running(distance, duration, [lat, lng], cadence);
    }
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !conditionChecker(elevation, distance, duration) ||
        !positiveChecker(distance, duration)
      )
        // if workout cycling create cycling object
        return alert('Entry fields must have positive numbers!!');
      workout = new Cycling(distance, duration, [lat, lng], elevation);
    }
    // add new object to workouts array
    this.#workouts.push(workout);
    // render workout on map as marker
    this._renderMarker(workout);
    // render workout on list
    this._renderWorkout(workout);
    //clear input fields
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
    this._setLocalStorage();
  }
  _renderMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.name}-popup`,
        })
      )
      .setPopupContent(
        `${workout.name === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.discription}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    // console.log(workout.date, formatdate);
    let htmlEl = `<li class="workout workout--${workout.name}" data-id="${
      workout.id
    }">
    <h2 class="workout__title">${workout.discription}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.name === 'running' ? '🏃‍♂️' : '🚴‍♀️'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${
        workout.name === 'running'
          ? workout.pace.toFixed(1)
          : workout.speed.toFixed(1)
      }</span>
      <span class="workout__unit">${
        workout.name === 'running' ? 'min/km' : 'km/hr'
      }</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.name === 'running' ? '🦶🏼' : '⛰'
      }</span>
      <span class="workout__value">${
        workout.name === 'running' ? workout.cadence : workout.elevationGain
      }</span>
      <span class="workout__unit">${
        workout.name === 'running' ? 'spm' : 'm'
      }</span>
    </div>
  </li>`;
    form.insertAdjacentHTML('afterend', htmlEl);
  }
  _moveToPopup(e) {
    // e.preventDefault();
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;
    // console.log(workoutEl.dataset.id);
    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    // console.log(workout);
    this.#map.setView(workout.coords, this.#mapZoom),
      {
        animate: true,
        pan: {
          duration: 1,
        },
      };
  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(work => this._renderWorkout(work));
    // this._renderWorkout();
    // console.log(data);
  }
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}
const mapLoad = new App();
