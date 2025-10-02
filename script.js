document.addEventListener('DOMContentLoaded', () => {
  // Sections
  const signupSection = document.getElementById('signup-section');
  const loginSection = document.getElementById('login-section');
  const homeSection = document.getElementById('home-section');
  const recipeSection = document.getElementById('recipe-section');
  const favoritesSection = document.getElementById('favorites-section');

  // Signup / Login elements
  const signupForm = document.getElementById('signup-form');
  const signupMessage = document.getElementById('signup-message');
  const loginForm = document.getElementById('login-form');
  const loginMessage = document.getElementById('login-message');
  const goSignup = document.getElementById('go-signup');
  const goLogin = document.getElementById('go-login');

  // Home elements
  const userDisplay = document.getElementById('user-display');
  const logoutBtn = document.getElementById('logout-btn');
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const resultsGrid = document.getElementById('results-grid');
  const messageArea = document.getElementById('message-area');
  const randomButton = document.getElementById('random-button');
  const openFavsBtn = document.getElementById('open-favs-btn'); // center star button
  const filterContainer = document.getElementById('filter-container');

  // Right panel (filters + favorites)
  const rightPanel = document.getElementById('right-panel');
  const menuButton = document.getElementById('menu-button');
  const closePanel = document.getElementById('close-panel');
  const panelFavorites = document.getElementById('panel-favorites');

  // Quick filters container
  const quickFilters = document.getElementById('quick-filters');
  const filtersQuickBtn = document.getElementById('filters-quick-btn');

  // Recipe elements
  const backBtn = document.getElementById('back-btn');
  const recipeContent = document.getElementById('recipe-details-content');
  const recipeMessage = document.getElementById('recipe-message');
  const favToggleBtn = document.getElementById('fav-toggle-btn');

  // Favorites elements
  const favoritesGrid = document.getElementById('favorites-grid');
  const favsMessage = document.getElementById('favs-message');
  const backToHomeFromFavs = document.getElementById('back-to-home-from-favs');

  // API
  const API_BASE = "https://www.themealdb.com/api/json/v1/1/";

  let currentUser = null;
  let currentRecipe = null;

  const favKeyFor = (username) => `mealquest-favs-${username}`;

  function showSection(section) {
    [signupSection, loginSection, homeSection, recipeSection, favoritesSection].forEach(s => s.classList.add('d-none'));
    section.classList.remove('d-none');
  }

  // SIGNUP / LOGIN
  goSignup.addEventListener('click', () => { showSection(signupSection); signupMessage.textContent=''; });
  goLogin.addEventListener('click', () => { showSection(loginSection); loginMessage.textContent=''; });

  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('signup-username').value.trim();
    const password = document.getElementById('signup-password').value.trim();
    if (!username || !password) { signupMessage.textContent='Enter username & password'; signupMessage.style.color='red'; return; }
    if (localStorage.getItem(`mealquest-user-${username}`)) { signupMessage.textContent='Username exists'; signupMessage.style.color='red'; return; }
    localStorage.setItem(`mealquest-user-${username}`, password);
    signupMessage.textContent='Sign up successful — login now'; signupMessage.style.color='green'; signupForm.reset();
  });

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    if (localStorage.getItem(`mealquest-user-${username}`) === password) {
      currentUser = username;
      localStorage.setItem('mealquest-current-user', username);
      afterLogin();
    } else { loginMessage.textContent='Invalid credentials'; loginMessage.style.color='red'; }
  });

  function afterLogin() {
    showSection(homeSection);
    userDisplay.textContent = `Hi, ${currentUser}`;
    userDisplay.style.color = '#fff';
    if (!localStorage.getItem(favKeyFor(currentUser))) localStorage.setItem(favKeyFor(currentUser), JSON.stringify([]));
    // load initial recipes on home show
    loadInitialRecipes();
  }

  const savedUser = localStorage.getItem('mealquest-current-user');
  if (savedUser) { currentUser = savedUser; afterLogin(); }

  logoutBtn.addEventListener('click', () => {
    currentUser = null;
    localStorage.removeItem('mealquest-current-user');
    showSection(loginSection);
    resultsGrid.innerHTML = '';
  });

  // SIDE FILTERS DATA (same as before)
  const filtersData = {
    'Cuisines': ['American','British','Canadian','Chinese','Dutch','Egyptian','French','Indian','Italian','Japanese','Mexican','Moroccan','Russian','Spanish','Thai','Tunisian','Turkish','Vietnamese'],
    'Meal Type': ['Breakfast','Lunch','Dinner','Side','Dessert','Starter'],
    'Diet Type': ['Vegetarian','Non-Vegetarian']
  };

  // create filters in the filterContainer (which is inside the right panel)
  for (let category in filtersData) {
    const wrapper = document.createElement('div');
    wrapper.className='filter-wrapper';
    wrapper.innerHTML=`<div class="filter-title">${category}</div><div class="filter-options d-none"></div>`;
    const optionsDiv = wrapper.querySelector('.filter-options');
    filtersData[category].forEach(opt => {
      const btn = document.createElement('div');
      btn.className='filter-option';
      btn.textContent = opt;
      btn.addEventListener('click', () => { 
        // close panel when selecting a filter
        closeRightPanel();
        fetchByFilter(category,opt); 
      });
      optionsDiv.appendChild(btn);
    });
    wrapper.querySelector('.filter-title').addEventListener('click',()=>optionsDiv.classList.toggle('d-none'));
    filterContainer.appendChild(wrapper);
  }

  // create some quick filter pills (popular ones) under hero
  const popular = ['Indian','American','Mexican','Breakfast','Vegetarian','Dinner'];
  popular.forEach(p=>{
    const pill = document.createElement('div');
    pill.className = 'pill';
    pill.textContent = p;
    pill.addEventListener('click', ()=>{
      // determine category for this quick pill
      if (['Vegetarian','Non-Vegetarian'].includes(p)) fetchByFilter('Diet Type', p);
      else if (['Breakfast','Lunch','Dinner','Side','Dessert','Starter'].includes(p)) fetchByFilter('Meal Type', p);
      else fetchByFilter('Cuisines', p);
      window.scrollTo({top: document.getElementById('results-grid').offsetTop - 80, behavior:'smooth'});
    });
    quickFilters.appendChild(pill);
  });

  // Map meal type map (same as before)
  const mealTypeMap = {
    "Breakfast": "Breakfast",
    "Lunch": "Beef",
    "Dinner": "Chicken",
    "Side": "Side",
    "Dessert": "Dessert",
    "Starter": "Starter",
  };

  async function fetchByFilter(category, opt) {
    resultsGrid.innerHTML = '';
    messageArea.textContent = 'Loading...';
    let url = '';

    if (category === 'Cuisines') {
      url = `${API_BASE}filter.php?a=${encodeURIComponent(opt)}`;
    } 
    else if (category === 'Meal Type') {
      const apiCategory = mealTypeMap[opt] || opt;
      url = `${API_BASE}filter.php?c=${encodeURIComponent(apiCategory)}`;
    } 
    else if (category === 'Diet Type') {
      const vegetarianCategories = ['Vegetarian', 'Vegan'];
      const nonVegCategories = ['Beef','Chicken','Pork','Lamb','Seafood','Goat','Miscellaneous'];

      let categoriesToFetch = opt === 'Vegetarian' ? vegetarianCategories : nonVegCategories;
      let allMeals = [];

      for (let cat of categoriesToFetch) {
        try {
          const res = await fetch(`${API_BASE}filter.php?c=${encodeURIComponent(cat)}`);
          const data = await res.json();
          if (data.meals) allMeals = allMeals.concat(data.meals);
        } catch {}
      }

      if (allMeals.length > 0) {
        displayRecipes(allMeals);
        messageArea.textContent = '';
      } else {
        messageArea.textContent = 'No recipes found';
      }
      return;
    }

    // For Cuisines & Meal Type
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.meals) {
        displayRecipes(data.meals);
        messageArea.textContent = '';
      } else {
        messageArea.textContent = 'No recipes found';
      }
    } catch {
      messageArea.textContent = 'Error fetching recipes';
    }
  }

  // SEARCH
  searchForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const q=searchInput.value.trim();
    if(!q){ messageArea.textContent='Enter search term'; return; }
    resultsGrid.innerHTML='';
    messageArea.textContent='Searching...';
    try {
      const res=await fetch(`${API_BASE}search.php?s=${encodeURIComponent(q)}`);
      const data=await res.json();
      if(data.meals){ displayRecipes(data.meals); messageArea.textContent=''; }
      else{ messageArea.textContent='No recipes found'; }
    } catch { messageArea.textContent='Error fetching recipes'; }
  });

  // RANDOM
  randomButton.addEventListener('click', async ()=>{
    resultsGrid.innerHTML='';
    messageArea.textContent='Fetching random meal...';
    try{
      const res=await fetch(`${API_BASE}random.php`);
      const data=await res.json();
      if(data.meals){ displayRecipes(data.meals); messageArea.textContent=''; }
      else{ messageArea.textContent='No recipe found'; }
    }catch{ messageArea.textContent='Error fetching recipe'; }
  });

  function displayRecipes(meals){
    resultsGrid.innerHTML='';
    meals.forEach(meal=>{
      const col=document.createElement('div');
      col.className='col-md-4 mb-3';
      col.innerHTML=`
        <div class="card position-relative h-100 recipe-card">
          <button class="fav-star" title="Add to favorites"><i class="bi bi-star"></i></button>
          <img src="${meal.strMealThumb}" class="card-img-top" alt="${meal.strMeal}">
          <div class="card-body">
            <h5 class="card-title">${meal.strMeal}</h5>
            <p class="card-text small text-muted">${meal.strArea || ''} ${meal.strCategory ? '• '+meal.strCategory : ''}</p>
          </div>
        </div>
      `;
      const card = col.querySelector('.card');
      const starBtn = col.querySelector('.fav-star');
      const icon = starBtn.querySelector('i');

      const favs = JSON.parse(localStorage.getItem(favKeyFor(currentUser))||'[]');
      icon.className = favs.some(f=>f.idMeal===meal.idMeal)?'bi bi-star-fill text-warning':'bi bi-star';
      starBtn.addEventListener('click', ev=>{ ev.stopPropagation(); toggleFavorite(meal,icon); });
      card.addEventListener('click', ()=>showRecipe(meal.idMeal));
      resultsGrid.appendChild(col);
    });
  }

  // FAVORITES
  function getFavorites(){ return JSON.parse(localStorage.getItem(favKeyFor(currentUser))||'[]'); }
  function saveFavorites(arr){ localStorage.setItem(favKeyFor(currentUser),JSON.stringify(arr)); }

  function toggleFavorite(mealObj,iconEl=null){
    let favs=getFavorites();
    const idx=favs.findIndex(f=>f.idMeal===mealObj.idMeal);
    if(idx>=0){ favs.splice(idx,1); if(iconEl) iconEl.className='bi bi-star'; }
    else{ favs.push(mealObj); if(iconEl) iconEl.className='bi bi-star-fill text-warning'; }
    saveFavorites(favs);
    if(!favoritesSection.classList.contains('d-none')) renderFavorites();
  }

  // clicking center star opens favorites section (existing flow)
  openFavsBtn.addEventListener('click', ()=>{ 
    if(!currentUser){ alert('Login first'); return; } 
    showSection(favoritesSection); 
    renderFavorites(); 
  });

  backToHomeFromFavs.addEventListener('click', ()=>{ showSection(homeSection); });

  function renderFavorites(){
    favoritesGrid.innerHTML='';
    const favs=getFavorites();
    if(!favs || favs.length===0){ favsMessage.textContent='No favorites yet'; return; }
    favsMessage.textContent='';
    favs.forEach(meal=>{
      const col=document.createElement('div');
      col.className='col-md-4 mb-3';
      col.innerHTML=`
        <div class="card h-100">
          <img src="${meal.strMealThumb}" class="card-img-top" alt="${meal.strMeal}">
          <div class="card-body">
            <h5 class="card-title">${meal.strMeal}</h5>
            <button class="btn btn-sm btn-outline-danger remove-fav-btn"><i class="bi bi-trash"></i> Remove</button>
            <button class="btn btn-sm btn-primary view-fav-btn ms-2">View</button>
          </div>
        </div>
      `;
      col.querySelector('.remove-fav-btn').addEventListener('click', ()=>{
        let favs=getFavorites(); const idx=favs.findIndex(f=>f.idMeal===meal.idMeal);
        if(idx>=0){ favs.splice(idx,1); saveFavorites(favs); renderFavorites(); }
      });
      col.querySelector('.view-fav-btn').addEventListener('click', ()=>showRecipe(meal.idMeal));
      favoritesGrid.appendChild(col);
    });
  }

  // RECIPE DETAILS
  async function showRecipe(id){
    showSection(recipeSection);
    recipeContent.innerHTML='';
    recipeMessage.textContent='Loading...';
    try{
      const res=await fetch(`${API_BASE}lookup.php?i=${id}`);
      const data=await res.json();
      if(data.meals && data.meals.length>0){
        const meal=data.meals[0];
        currentRecipe=meal;
        displayRecipeDetails(meal);
        updateFavButton();
        recipeMessage.textContent='';
      }else recipeMessage.textContent='Recipe not found';
    }catch{ recipeMessage.textContent='Error loading recipe'; }
  }

  function displayRecipeDetails(meal){
    let ingredients='';
    for(let i=1;i<=20;i++){
      if(meal['strIngredient'+i]) ingredients+=`<li>${meal['strIngredient'+i]} - ${meal['strMeasure'+i]}</li>`;
    }
    recipeContent.innerHTML=`
      <div class="row g-3">
        <div class="col-md-5">
          <img src="${meal.strMealThumb}" class="img-fluid rounded" alt="${meal.strMeal}">
        </div>
        <div class="col-md-7">
          <h2>${meal.strMeal}</h2>
          ${meal.strCategory?`<p><strong>Category:</strong> ${meal.strCategory}</p>`:''}
          ${meal.strArea?`<p><strong>Area:</strong> ${meal.strArea}</p>`:''}
          ${meal.strInstructions?`<h5>Instructions</h5><p style="white-space: pre-line;">${meal.strInstructions}</p>`:''}
          ${ingredients?`<h5>Ingredients</h5><ul>${ingredients}</ul>`:''}
          ${meal.strSource?`<p><a href="${meal.strSource}" target="_blank">Original Source</a></p>`:''}
        </div>
      </div>
    `;
  }

  function updateFavButton(){
    if(!currentRecipe) return;
    const favs=getFavorites();
    const isFav=favs.some(f=>f.idMeal===currentRecipe.idMeal);
    favToggleBtn.innerHTML=`<i class="bi ${isFav?'bi-star-fill text-warning':'bi-star'}"></i> ${isFav?'Favorited':'Add to Favorites'}`;
  }

  favToggleBtn.addEventListener('click', ()=>{
    if(!currentRecipe) return;
    toggleFavorite(currentRecipe);
    updateFavButton();
  });

  backBtn.addEventListener('click', ()=>{
    showSection(homeSection);
    recipeContent.innerHTML='';
    currentRecipe=null;
  });
 // RIGHT PANEL (filters + panel favorites) open/close
  function openRightPanel() {
  rightPanel.classList.add('open');
  rightPanel.setAttribute('aria-hidden', 'false');
  document.body.classList.add('panel-open');
  renderFavoritesPanel(); // if needed
}

function closeRightPanel() {
  rightPanel.classList.remove('open');
  rightPanel.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('panel-open');
}

  menuButton.addEventListener('click', ()=> openRightPanel());
  closePanel.addEventListener('click', ()=> closeRightPanel());
  filtersQuickBtn.addEventListener('click', ()=> openRightPanel());

  // render favorites inside the right panel (quick view)
  function renderFavoritesPanel(){
    panelFavorites.innerHTML = '';
    const favs = getFavorites();
    if(!favs || favs.length === 0){
      panelFavorites.textContent = 'No favorites yet';
      return;
    }
    favs.forEach(meal=>{
      const row = document.createElement('div');
      row.className = 'd-flex align-items-center mb-2';
      row.innerHTML = `
        <img src="${meal.strMealThumb}" style="width:60px;height:40px;object-fit:cover;border-radius:6px;margin-right:10px">
        <div style="flex:1">
          <div style="font-weight:600">${meal.strMeal}</div>
        </div>
        <button class="btn btn-sm btn-primary btn-view-mini">View</button>
      `;
      row.querySelector('.btn-view-mini').addEventListener('click', ()=>{
        closeRightPanel();
        showRecipe(meal.idMeal);
      });
      panelFavorites.appendChild(row);
    });
  }

  // INITIAL LOAD: load 6 random recipes to display on home open
  async function loadInitialRecipes(count = 6){
    resultsGrid.innerHTML = '';
    messageArea.textContent = 'Loading featured recipes...';
    const fetched = {};
    const meals = [];
    const promises = [];
    for(let i=0;i<count;i++){
      promises.push(fetch(`${API_BASE}random.php`).then(r=>r.json()).then(data=>{
        if(data.meals && data.meals[0]){
          const m = data.meals[0];
          // avoid duplicates by id
          if(!fetched[m.idMeal]){
            meals.push(m);
            fetched[m.idMeal] = true;
          }
        }
      }).catch(()=>{}));
    }
    try{
      await Promise.all(promises);
      if(meals.length>0){
        displayRecipes(meals);
        messageArea.textContent = '';
      } else {
        messageArea.textContent = 'No recipes available';
      }
    } catch {
      messageArea.textContent = 'Error loading featured recipes';
    }
  }

  // small helpers to show favorites even when user clicks header star (already wired)
  // (openFavsBtn is wired earlier to open the favorites 'section' existing behaviour)

  // If the page loads with a saved user, initial recipes were loaded in afterLogin.
  // If user logs in later, afterLogin triggers loadInitialRecipes as well.
  
});
