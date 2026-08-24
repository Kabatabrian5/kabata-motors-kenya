/* Mobile Menu Toggle */
const menuToggleBtn = document.getElementById('menuToggleBtn');
const mobileNavDrawer = document.getElementById('mobileNavDrawer');
const closeDrawerBtn = document.getElementById('closeDrawerBtn');

if (menuToggleBtn && mobileNavDrawer) {
  menuToggleBtn.addEventListener('click', () => mobileNavDrawer.classList.add('open'));
}
if (closeDrawerBtn && mobileNavDrawer) {
  closeDrawerBtn.addEventListener('click', () => mobileNavDrawer.classList.remove('open'));
}

// Helper Function for Relative Time Formatting
function getRelativeTimeString(dateString) {
  if (!dateString) return 'Recently posted';
  const now = new Date();
  const postedDate = new Date(dateString);
  const diffInSeconds = Math.floor((now - postedDate) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} min${diffInMinutes > 1 ? 's' : ''} ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
}

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('carListings');
  const searchInput = document.getElementById('searchInput');
  const makeFilter = document.getElementById('makeFilter');
  const priceFilter = document.getElementById('priceFilter');
  const yearFilter = document.getElementById('yearFilter');
  const locationFilter = document.getElementById('locationFilter');
  const transmissionFilter = document.getElementById('transmissionFilter');
  const fuelFilter = document.getElementById('fuelFilter');
  const ccFilter = document.getElementById('ccFilter');
  const brandLogoContainer = document.getElementById('brandLogoContainer');

  // Inject Modal Container dynamically into body
  const modalWrapper = document.createElement('div');
  modalWrapper.id = 'carDetailModal';
  modalWrapper.style.cssText = 'display:none; position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:9999; overflow-y:auto; padding:20px;';
  document.body.appendChild(modalWrapper);

  // Initialize Supabase Client
  if (typeof supabase === 'undefined') {
    if (container) container.innerHTML = `<p style="color:red; text-align:center;">Error: Supabase SDK is not loaded properly.</p>`;
    return;
  }

  const supabaseClient = supabase.createClient(
    'https://qzqvyceabwxvzeyifnpw.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6cXZ5Y2VhYnd4dnpleWxmbnB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3NzEzMzUsImV4cCI6MjEwMjM0NzMzNX0.9fDJGRjaCamvZhxkfhwu08vFTTPcabZ00VBvi_av1wk'
  );

  let cars = [];
  window.filteredCarsData = [];

  // Fetch Live Cars from Supabase Database
  try {
    if (container) container.innerHTML = `<p style="text-align:center; padding:20px; color:#666;">Loading live vehicles...</p>`;
    
    const { data, error } = await supabaseClient
      .from('cars')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    cars = data || [];
    window.filteredCarsData = cars;
  } catch (err) {
    console.error('Failed to load cars from database:', err);
    if (container) container.innerHTML = `<p style="color:red; text-align:center;">Error loading inventory from database: ${err.message}</p>`;
    return;
  }

  // 1. Render Cars with Lazy Loading & Optimized Performance
  function renderCars(items) {
    if (!container) return;
    if (items.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: #fff; border-radius: 8px;">
          <h3>No vehicles found</h3>
          <p style="color: #666;">Try adjusting your search or filters.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = items.map((car, index) => {
      const timeAgo = getRelativeTimeString(car.created_at || car.dateAdded);
      const rawImage = Array.isArray(car.images) && car.images.length > 0 ? car.images[0] : (car.image || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf');
      
      return `
        <div class="car-card" style="background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); display:flex; flex-direction:column; justify-content:space-between; position:relative;">
          <div style="position:absolute; top:10px; right:10px; background:rgba(0,0,0,0.75); color:#fff; font-size:11px; padding:3px 8px; border-radius:12px; font-weight:bold; z-index:2;">
            ⏱️ ${timeAgo}
          </div>
          <div class="car-img-container" style="background:#f4f4f4; height:160px;">
            <img src="${rawImage}" alt="${car.make} ${car.model}" loading="${index === 0 ? 'eager' : 'lazy'}" fetchpriority="${index === 0 ? 'high' : 'auto'}" decoding="async" width="800" height="450" style="width: 100%; height: 160px; object-fit: cover;">
          </div>
          <div class="car-details" style="padding: 15px;">
            <h3 style="font-size: 1.1rem; color: #111; margin: 0 0 8px 0;">${car.make} ${car.model}</h3>
            <p style="font-weight: 800; color: #ff4d00; font-size: 1.1rem; margin: 0 0 6px 0;">Ksh ${car.price.toLocaleString()}</p>
            <p style="font-size: 13px; color: #555; margin: 2px 0;">Year: ${car.year} | Loc: ${car.location}</p>
            <p style="font-size: 13px; color: #555; margin: 2px 0;">Trans: ${car.transmission} | Fuel: ${car.fuel}</p>
          </div>
          <div style="padding: 0 15px 15px 15px;">
            <button onclick="openCarDetails(${index})" style="width: 100%; background: #111; color: #fff; border: none; padding: 10px; border-radius: 4px; font-weight: bold; cursor: pointer;">View Details</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Global Function to Open Detailed Car Modal with Fast Gallery
  window.openCarDetails = function(carIndex) {
    const activeCarsList = window.filteredCarsData || cars;
    const car = activeCarsList[carIndex];
    if (!car) return;

    const absoluteIndex = cars.findIndex(c => c.id === car.id || c === car);
    const timeAgo = getRelativeTimeString(car.created_at || car.dateAdded);
    
    let imageList = [];
    if (Array.isArray(car.images) && car.images.length > 0) {
      imageList = car.images;
    } else if (car.image) {
      imageList = [car.image];
    } else {
      imageList = ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf'];
    }

    modalWrapper.style.display = 'block';
    modalWrapper.innerHTML = `
      <div style="max-width: 900px; margin: 40px auto; background: #fff; border-radius: 10px; padding: 30px; position:relative; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
        <button onclick="closeCarDetails()" style="position:absolute; top:20px; right:20px; background:#eee; border:none; font-size:18px; width:35px; height:35px; border-radius:50%; cursor:pointer; font-weight:bold;">&times;</button>
        
        <h2 style="margin-top:0; font-size:1.6rem; color:#111;">${car.make} ${car.model} ${car.year} ${car.color || ''}</h2>
        
        <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap:wrap; align-items:center;">
          <span style="background:#f2f2f2; padding:5px 10px; border-radius:4px; font-size:12px; font-weight:bold;">📅 ${car.year}</span>
          <span style="background:#f2f2f2; padding:5px 10px; border-radius:4px; font-size:12px; font-weight:bold;">⚙️ ${car.transmission}</span>
          <span style="background:#f2f2f2; padding:5px 10px; border-radius:4px; font-size:12px; font-weight:bold;">⛽ ${car.fuel}</span>
          <span style="background:#f2f2f2; padding:5px 10px; border-radius:4px; font-size:12px; font-weight:bold;">📍 ${car.location}</span>
          <span style="background:#e6f4ea; color:#137333; padding:5px 10px; border-radius:4px; font-size:12px; font-weight:bold;">⏱️ Posted ${timeAgo}</span>
          
          <div style="margin-left:auto; display:flex; gap:8px;">
            <button onclick="compareSamePrice(${car.price}, '${car.make} ${car.model}')" style="background:#ffc107; border:none; padding:8px 12px; border-radius:4px; font-weight:bold; cursor:pointer; display:flex; align-items:center; gap:4px; font-size:13px;">⚖️ Compare Price</button>
            <button onclick="compareSameMakeModel(${absoluteIndex >= 0 ? absoluteIndex : carIndex})" style="background:#111; color:#fff; border:none; padding:8px 12px; border-radius:4px; font-weight:bold; cursor:pointer; display:flex; align-items:center; gap:4px; font-size:13px;">🚗 Compare Same Model</button>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; align-items: start;">
          <div>
            <!-- Main Active Image Viewer -->
            <div style="position:relative; background:#f4f4f4; border-radius:8px;">
              <img id="activeCarImage" src="${imageList[0]}" loading="lazy" style="width:100%; height:320px; object-fit:cover; border-radius:8px; border:1px solid #ddd;">
              <span style="position:absolute; bottom:10px; left:10px; background:rgba(0,0,0,0.6); color:#fff; font-size:11px; padding:4px 8px; border-radius:4px;">Click thumbnails below to switch view</span>
            </div>

            <!-- Thumbnail Gallery -->
            <div style="margin-top: 12px;">
              <p style="font-size: 13px; font-weight: bold; color: #333; margin: 0 0 6px 0;">📸 Vehicle Angles & Gallery (${imageList.length} Photos):</p>
              <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 5px;">
                ${imageList.map((imgUrl, i) => `
                  <img src="${imgUrl}" loading="lazy" onclick="switchModalImage('${imgUrl}', this)" style="width: 75px; height: 55px; object-fit: cover; border-radius: 4px; cursor: pointer; border: ${i === 0 ? '2px solid #ff4d00' : '1px solid #ccc'}; opacity: ${i === 0 ? '1' : '0.7'}; transition:all 0.2s;" class="gallery-thumb" alt="Angle ${i+1}">
                `).join('')}
              </div>
            </div>

            <h3 style="margin-top:20px; font-size:1.2rem;">Description</h3>
            <p style="color:#555; line-height:1.5;">Well-maintained and slightly used ${car.make} ${car.model} on sale. Locally used, ${car.transmission}, ${car.fuel}. Excellent deal ready for driving in Kenya.</p>
            
            <h3 style="margin-top:20px; font-size:1.2rem;">Car Overview</h3>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:14px; color:#444;">
              <p><b>Make:</b> ${car.make}</p>
              <p><b>Model:</b> ${car.model}</p>
              <p><b>Year:</b> ${car.year}</p>
              <p><b>Fuel Type:</b> ${car.fuel}</p>
              <p><b>Transmission:</b> ${car.transmission}</p>
              <p><b>Engine CC:</b> ${car.cc || 'N/A'}</p>
              <p><b>Location:</b> ${car.location}</p>
            </div>
          </div>

          <div style="background:#f9f9f9; padding:20px; border-radius:8px; border:1px solid #e1e1e1;">
            <p style="font-size:12px; color:#777; margin:0;">Selling Price</p>
            <h2 style="color:#ff4d00; margin:5px 0 15px 0;">Ksh ${car.price.toLocaleString()}</h2>
            <button style="width:100%; background:#a30000; color:#fff; border:none; padding:12px; border-radius:6px; font-weight:bold; cursor:pointer; margin-bottom:10px;">Get Car Financing</button>
            <button style="width:100%; background:#25d366; color:#fff; border:none; padding:10px; border-radius:6px; font-weight:bold; cursor:pointer;">WhatsApp Broker</button>
          </div>
        </div>

        <div id="comparisonSection" style="margin-top:30px; border-top:1px solid #ddd; padding-top:20px; display:none;"></div>
      </div>
    `;
  };

  window.switchModalImage = function(url, thumbElement) {
    const mainImg = document.getElementById('activeCarImage');
    if (mainImg) mainImg.src = url;

    document.querySelectorAll('.gallery-thumb').forEach(t => {
      t.style.border = '1px solid #ccc';
      t.style.opacity = '0.7';
    });
    thumbElement.style.border = '2px solid #ff4d00';
    thumbElement.style.opacity = '1';
  };

  window.closeCarDetails = function() {
    modalWrapper.style.display = 'none';
  };

  window.compareSamePrice = function(targetPrice, currentCarName) {
    const compSection = document.getElementById('comparisonSection');
    if (!compSection) return;

    const lowerBound = targetPrice * 0.8;
    const upperBound = targetPrice * 1.2;

    const similarCars = cars.filter(c => c.price >= lowerBound && c.price <= upperBound && `${c.make} ${c.model}` !== currentCarName);

    compSection.style.display = 'block';
    compSection.innerHTML = `
      <h3 style="font-size:1.2rem; color:#111; margin-bottom:12px;">⚖️ Vehicles with Similar Price (Ksh ${lowerBound.toLocaleString()} - Ksh ${upperBound.toLocaleString()})</h3>
      ${similarCars.length === 0 ? '<p style="color:#666;">No other vehicles found in this direct price range.</p>' : `
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:15px;">
          ${similarCars.map(sc => `
            <div style="background:#fff; border:1px solid #ddd; border-radius:6px; padding:10px;">
              <img src="${Array.isArray(sc.images) ? sc.images[0] : sc.image}" loading="lazy" style="width:100%; height:110px; object-fit:cover; border-radius:4px;">
              <h4 style="font-size:1rem; margin:8px 0 4px 0;">${sc.make} ${sc.model}</h4>
              <p style="color:#ff4d00; font-weight:bold; font-size:0.95rem; margin:0 0 4px 0;">Ksh ${sc.price.toLocaleString()}</p>
              <p style="font-size:12px; color:#666; margin:0;">Year: ${sc.year} | ${sc.transmission}</p>
            </div>
          `).join('')}
        </div>
      `}
    `;
  };

  window.compareSameMakeModel = function(carIndex) {
    const currentCar = cars[carIndex];
    const compSection = document.getElementById('comparisonSection');
    if (!currentCar || !compSection) return;

    const matchingModels = cars.filter((c, idx) => 
      c.make.toLowerCase() === currentCar.make.toLowerCase() && 
      c.model.toLowerCase() === currentCar.model.toLowerCase() && 
      idx !== carIndex
    );

    compSection.style.display = 'block';
    compSection.innerHTML = `
      <h3 style="font-size:1.2rem; color:#111; margin-bottom:12px;">🚗 Other Options for ${currentCar.make} ${currentCar.model} in System</h3>
      ${matchingModels.length === 0 ? '<p style="color:#666;">No other listings of this exact make and model found in the system right now.</p>' : `
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:15px;">
          ${matchingModels.map(mc => `
            <div style="background:#fff; border:1px solid #ddd; border-radius:6px; padding:10px;">
              <img src="${Array.isArray(mc.images) ? mc.images[0] : mc.image}" loading="lazy" style="width:100%; height:110px; object-fit:cover; border-radius:4px;">
              <h4 style="font-size:1rem; margin:8px 0 4px 0;">${mc.make} ${mc.model} (${mc.year})</h4>
              <p style="color:#ff4d00; font-weight:bold; font-size:0.95rem; margin:0 0 4px 0;">Ksh ${mc.price.toLocaleString()}</p>
              <p style="font-size:12px; color:#666; margin:0;">Loc: ${mc.location} | ${mc.transmission}</p>
            </div>
          `).join('')}
        </div>
      `}
    `;
  };

  renderCars(cars);

  const populateSelect = (element, values) => {
    if (!element) return;
    [...new Set(values)].sort().forEach(val => {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = val;
      element.appendChild(opt);
    });
  };

  const kenyanMarketMakes = [
    ...cars.map(c => c.make),
    'Toyota', 'Mazda', 'Subaru', 'Nissan', 'Honda', 'Mitsubishi', 
    'Mercedes-Benz', 'BMW', 'Volkswagen', 'Audi', 'Lexus', 'Land Rover', 
    'Range Rover', 'Ford', 'Hyundai', 'Kia', 'Suzuki', 'Isuzu', 'Peugeot', 'Porsche'
  ];

  populateSelect(makeFilter, kenyanMarketMakes);

  if (locationFilter) {
    locationFilter.innerHTML = '<option value="">All Locations</option>';
    const kenyanTowns = [
      'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 
      'Thika', 'Kitengela', 'Ruiru', 'Kiambu', 'Machakos', 
      'Meru', 'Nyeri', 'Kakamega', 'Kisii', 'Malindi', 'Naivasha'
    ];
    kenyanTowns.sort().forEach(town => {
      const opt = document.createElement('option');
      opt.value = town;
      opt.textContent = town;
      locationFilter.appendChild(opt);
    });
  }

  if (transmissionFilter) {
    transmissionFilter.innerHTML = '<option value="">Transmission</option>';
    ['Automatic', 'Manual', 'Electric'].forEach(trans => {
      const opt = document.createElement('option');
      opt.value = trans;
      opt.textContent = trans;
      transmissionFilter.appendChild(opt);
    });
  }

  if (fuelFilter) {
    fuelFilter.innerHTML = '<option value="">Fuel Type</option>';
    ['Petrol', 'Diesel', 'Hybrid', 'Electric'].forEach(fuel => {
      const opt = document.createElement('option');
      opt.value = fuel;
      opt.textContent = fuel;
      fuelFilter.appendChild(opt);
    });
  }

  if (ccFilter) {
    ccFilter.innerHTML = '<option value="">Engine CC</option>';
    const ccOptions = [
      { label: 'Under 1,000 CC', max: 1000 },
      { label: '1,000 CC - 1,300 CC', min: 1000, max: 1300 },
      { label: '1,300 CC - 1,500 CC', min: 1300, max: 1500 },
      { label: '1,500 CC - 2,000 CC', min: 1500, max: 2000 },
      { label: '2,000 CC - 2,500 CC', min: 2000, max: 2500 },
      { label: '2,500 CC - 3,000 CC', min: 2500, max: 3000 },
      { label: 'Above 3,000 CC', min: 3000 }
    ];

    ccOptions.forEach(ccOpt => {
      const opt = document.createElement('option');
      opt.value = JSON.stringify({ min: ccOpt.min || 0, max: ccOpt.max || 99999 });
      opt.textContent = ccOpt.label;
      ccFilter.appendChild(opt);
    });
  }

  if (yearFilter) {
    yearFilter.innerHTML = '<option value="">Min Year</option>';
    for (let y = 2026; y >= 2010; y--) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = `${y} and Newer`;
      yearFilter.appendChild(opt);
    }
  }

  if (priceFilter) {
    priceFilter.innerHTML = '<option value="">Max Price (Ksh)</option>';
    const priceOptions = [
      { label: 'Below 500k', value: 500000 },
      { label: 'Below 1 Million', value: 1000000 },
      { label: 'Below 1.5 Million', value: 1500000 },
      { label: 'Below 2 Million', value: 2000000 },
      { label: 'Below 2.5 Million', value: 2500000 },
      { label: 'Below 3 Million', value: 3000000 },
      { label: 'Below 4 Million', value: 4000000 },
      { label: 'Below 5 Million', value: 5000000 },
      { label: 'Below 8 Million', value: 8000000 },
      { label: 'Below 10 Million', value: 10000000 }
    ];

    priceOptions.forEach(optData => {
      const opt = document.createElement('option');
      opt.value = optData.value;
      opt.textContent = optData.label;
      priceFilter.appendChild(opt);
    });
  }

  window.filterInventory = function() {
    const query = searchInput ? searchInput.value.toLowerCase() : '';
    const sMake = makeFilter ? makeFilter.value.toLowerCase() : '';
    const sLoc = locationFilter ? locationFilter.value.toLowerCase() : '';
    const sTrans = transmissionFilter ? transmissionFilter.value.toLowerCase() : '';
    const sFuel = fuelFilter ? fuelFilter.value.toLowerCase() : '';
    const sYear = yearFilter && yearFilter.value ? Number(yearFilter.value) : null;
    const sPrice = priceFilter && priceFilter.value ? Number(priceFilter.value) : null;
    
    let ccRange = null;
    if (ccFilter && ccFilter.value) {
      try { ccRange = JSON.parse(ccFilter.value); } catch(e) { ccRange = null; }
    }

    const filtered = cars.filter(car => {
      const matchesQuery = car.make.toLowerCase().includes(query) || car.model.toLowerCase().includes(query);
      const matchesMake = sMake === "" || car.make.toLowerCase() === sMake;
      const matchesLoc = sLoc === "" || car.location.toLowerCase() === sLoc;
      const matchesTrans = sTrans === "" || car.transmission.toLowerCase() === sTrans;
      const matchesFuel = sFuel === "" || car.fuel.toLowerCase() === sFuel;
      const matchesYear = sYear === null || Number(car.year) >= sYear;
      const matchesPrice = sPrice === null || Number(car.price) <= sPrice;
      
      let matchesCc = true;
      if (ccRange) {
        const carCc = Number(car.cc) || 0;
        matchesCc = carCc >= ccRange.min && carCc <= ccRange.max;
      }

      return matchesQuery && matchesMake && matchesLoc && matchesTrans && matchesFuel && matchesYear && matchesCc && matchesPrice;
    });

    window.filteredCarsData = filtered;
    renderCars(filtered);
  };

  [searchInput, makeFilter, locationFilter, transmissionFilter, fuelFilter, yearFilter, ccFilter, priceFilter].forEach(el => {
    if (el) el.addEventListener('input', filterInventory);
    if (el) el.addEventListener('change', filterInventory);
  });

  async function loadBrandsAsync() {
    if (!brandLogoContainer) return;
    try {
      const { data: brands, error } = await supabaseClient.from('brands').select('*');
      if (error || !brands) return;

      brandLogoContainer.innerHTML = brands.map(brand => `
        <div class="brand-badge" data-make="${brand.name}" style="background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 10px; min-width: 90px; text-align: center; cursor: pointer; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 6px;">
          <img src="${brand.logo_path}" alt="${brand.name}" loading="lazy" style="width: 36px; height: 36px; object-fit: contain;">
          <p style="font-size: 12px; font-weight: bold; margin: 0; color: #111;">${brand.name}</p>
        </div>
      `).join('');

      document.querySelectorAll('.brand-badge').forEach(badge => {
        badge.addEventListener('click', () => {
          if (makeFilter) {
            makeFilter.value = badge.getAttribute('data-make');
            filterInventory();
          }
        });
      });
    } catch (e) {
      console.log('Logo load skipped:', e);
    }
  }

  loadBrandsAsync();
});
