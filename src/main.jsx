const { useEffect, useMemo, useState } = React;

function MotionElement({ as: Tag, initial, animate, exit, transition, whileHover, children, ...props }) {
  return <Tag {...props}>{children}</Tag>;
}

const motion = new Proxy({}, {
  get: (_, tag) => (props) => <MotionElement as={tag} {...props} />
});

function AnimatePresence({ children }) {
  return children;
}

function makeIcon(label) {
  return function Icon({ size = 20 }) {
    return (
      <span className="local-icon" style={{ width: size, height: size, fontSize: Math.max(10, size - 6) }} aria-hidden="true">
        {label}
      </span>
    );
  };
}

const BarChart3 = makeIcon('B');
const Bell = makeIcon('!');
const BriefcaseBusiness = makeIcon('W');
const CalendarClock = makeIcon('T');
const Car = makeIcon('C');
const CheckCircle2 = makeIcon('✓');
const ChevronRight = makeIcon('>');
const CreditCard = makeIcon('P');
const Fuel = makeIcon('F');
const Gauge = makeIcon('G');
const History = makeIcon('H');
const Home = makeIcon('N');
const LayoutDashboard = makeIcon('D');
const LocateFixed = makeIcon('L');
const LogIn = makeIcon('I');
const MapPin = makeIcon('M');
const Menu = makeIcon('=');
const MessageCircle = makeIcon('Q');
const Navigation = makeIcon('A');
const Phone = makeIcon('V');
const Plus = makeIcon('+');
const Route = makeIcon('R');
const Search = makeIcon('S');
const Settings = makeIcon('O');
const ShieldCheck = makeIcon('K');
const Star = makeIcon('*');
const Users = makeIcon('U');
const Wallet = makeIcon('$');
const X = makeIcon('x');

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'find', label: 'Find Ride', icon: Search },
  { id: 'offer', label: 'Offer Ride', icon: Plus },
  { id: 'trips', label: 'My Trips', icon: CalendarClock },
  { id: 'tracking', label: 'Live Tracking', icon: LocateFixed },
  { id: 'vehicles', label: 'Vehicles', icon: Car },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'history', label: 'Ride History', icon: History },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'admin', label: 'Admin', icon: ShieldCheck }
];

const rides = [
  {
    driver: 'Priya Sharma',
    car: 'Hyundai Creta',
    from: 'Indiranagar',
    to: 'Manyata Tech Park',
    time: '08:15 AM',
    seats: 3,
    fare: 85,
    rating: 4.9,
    tag: 'Best match'
  },
  {
    driver: 'Arjun Mehta',
    car: 'Tata Nexon EV',
    from: 'Koramangala',
    to: 'Whitefield',
    time: '08:35 AM',
    seats: 2,
    fare: 110,
    rating: 4.8,
    tag: 'Low emission'
  },
  {
    driver: 'Nisha Rao',
    car: 'Honda City',
    from: 'HSR Layout',
    to: 'Electronic City',
    time: '09:00 AM',
    seats: 1,
    fare: 95,
    rating: 4.7,
    tag: 'Fast pickup'
  }
];

const trips = [
  { name: 'Office commute', status: 'Trip In Progress', route: 'Home to Office', eta: '12 min', fare: 85 },
  { name: 'Evening return', status: 'Ride Booked', route: 'Office to Home', eta: '6:30 PM', fare: 85 },
  { name: 'Airport pool', status: 'Payment Pending', route: 'Office to Airport', eta: 'Completed', fare: 240 }
];

const vehicles = [
  { model: 'Hyundai Creta', number: 'KA 03 MN 5482', seats: 4, efficiency: '15.8 km/l' },
  { model: 'Tata Nexon EV', number: 'KA 05 EV 2048', seats: 3, efficiency: '112 Wh/km' }
];

function App() {
  const [active, setActive] = useState('dashboard');
  const [authed, setAuthed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const pageTitle = useMemo(() => navItems.find((item) => item.id === active)?.label ?? 'Dashboard', [active]);

  useEffect(() => {
    if (window.anime) {
      window.anime({
        targets: '.panel, .metric, .ride-card',
        translateY: [10, 0],
        opacity: [0.72, 1],
        delay: window.anime.stagger(35),
        duration: 420,
        easing: 'easeOutQuad'
      });
    }
  }, [active, authed]);

  if (!authed) {
    return <AuthScreen onLogin={() => setAuthed(true)} />;
  }

  return (
    <div className="app-shell">
      <Sidebar active={active} setActive={setActive} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <main className="main-panel">
        <Topbar title={pageTitle} onMenu={() => setMenuOpen(true)} />
        <AnimatePresence mode="wait">
          <motion.section
            key={active}
            className="page"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {active === 'dashboard' && <Dashboard setActive={setActive} />}
            {active === 'find' && <FindRide />}
            {active === 'offer' && <OfferRide />}
            {active === 'trips' && <Trips />}
            {active === 'tracking' && <LiveTracking />}
            {active === 'vehicles' && <Vehicles />}
            {active === 'wallet' && <WalletPage />}
            {active === 'history' && <RideHistory />}
            {active === 'reports' && <Reports />}
            {active === 'settings' && <SettingsPage />}
            {active === 'admin' && <AdminPage />}
          </motion.section>
        </AnimatePresence>
      </main>
    </div>
  );
}

function AuthScreen({ onLogin }) {
  return (
    <div className="auth-screen">
      <motion.div className="auth-map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
        <span className="pin pin-a" />
        <span className="pin pin-b" />
        <span className="pin pin-c" />
        <motion.span
          className="moving-car"
          animate={{ offsetDistance: ['0%', '100%'] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
        >
          <Car size={20} />
        </motion.span>
      </motion.div>
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, scale: 0.96, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="brand-mark">
          <Route size={28} />
        </div>
        <p className="eyebrow">Enterprise carpooling</p>
        <h1>CommuteFlow</h1>
        <p className="muted">
          Find rides, offer seats, track trips live, and settle payments in one employee commute platform.
        </p>
        <div className="auth-tabs">
          <button className="active">Login</button>
          <button>Sign Up</button>
        </div>
        <label>
          Organization email
          <input defaultValue="employee@company.com" />
        </label>
        <label>
          Password
          <input type="password" defaultValue="commuteflow" />
        </label>
        <button className="primary full" onClick={onLogin}>
          <LogIn size={18} />
          Continue
        </button>
      </motion.div>
    </div>
  );
}

function Sidebar({ active, setActive, menuOpen, setMenuOpen }) {
  return (
    <>
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="side-brand">
          <div className="brand-mark small"><Route size={21} /></div>
          <div>
            <strong>CommuteFlow</strong>
            <span>Carpool platform</span>
          </div>
          <button className="icon-button close" onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={active === item.id ? 'active' : ''}
                onClick={() => {
                  setActive(item.id);
                  setMenuOpen(false);
                }}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>
      {menuOpen && <button className="scrim" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}
    </>
  );
}

function Topbar({ title, onMenu }) {
  return (
    <header className="topbar">
      <button className="icon-button menu-toggle" onClick={onMenu} aria-label="Open menu">
        <Menu size={20} />
      </button>
      <div>
        <p className="eyebrow">Saturday, 18 July</p>
        <h2>{title}</h2>
      </div>
      <div className="top-actions">
        <button className="icon-button" aria-label="Notifications"><Bell size={19} /></button>
        <div className="profile-chip">AS</div>
      </div>
    </header>
  );
}

function Dashboard({ setActive }) {
  return (
    <>
      <section className="hero-band">
        <div className="hero-copy">
          <p className="eyebrow">Live commute network</p>
          <h1>Share the ride to work with trusted employees.</h1>
          <p>Search matching rides, publish your route, track trips live, and keep every commute recorded.</p>
          <div className="button-row">
            <button className="primary" onClick={() => setActive('find')}><Search size={18} /> Find a ride</button>
            <button className="secondary" onClick={() => setActive('offer')}><Plus size={18} /> Offer seats</button>
          </div>
        </div>
        <RouteVisual />
      </section>
      <div className="metric-grid">
        <Metric icon={Users} label="Active employees" value="1,248" tone="green" />
        <Metric icon={Car} label="Published rides" value="186" tone="blue" />
        <Metric icon={Fuel} label="Fuel saved" value="412 L" tone="orange" />
        <Metric icon={Wallet} label="Wallet balance" value="₹1,850" tone="pink" />
      </div>
      <div className="content-grid">
        <Panel title="Recommended rides" action="View all">
          {rides.slice(0, 2).map((ride) => <RideCard key={ride.driver} ride={ride} compact />)}
        </Panel>
        <Panel title="Today trip status" action="Track">
          {trips.map((trip) => <TripRow key={trip.name} trip={trip} />)}
        </Panel>
      </div>
    </>
  );
}

function FindRide() {
  return (
    <div className="two-column">
      <Panel title="Find a ride" subtitle="Enter commute details to discover matching employee rides.">
        <RideForm type="find" />
      </Panel>
      <Panel title="Available rides" subtitle="Matches update after route confirmation.">
        {rides.map((ride) => <RideCard key={ride.driver} ride={ride} />)}
      </Panel>
    </div>
  );
}

function OfferRide() {
  return (
    <div className="two-column">
      <Panel title="Offer a ride" subtitle="Publish available seats only after selecting a registered vehicle.">
        <RideForm type="offer" />
      </Panel>
      <Panel title="Route confirmation">
        <RouteConfirmation />
      </Panel>
    </div>
  );
}

function RideForm({ type }) {
  return (
    <form className="form-stack">
      <label>Pickup location<input defaultValue={type === 'find' ? 'Indiranagar' : 'Koramangala'} /></label>
      <label>Destination<input defaultValue={type === 'find' ? 'Manyata Tech Park' : 'Whitefield'} /></label>
      <div className="field-grid">
        <label>Travel date<input type="date" defaultValue="2026-07-18" /></label>
        <label>Travel time<input type="time" defaultValue={type === 'find' ? '08:15' : '08:30'} /></label>
      </div>
      <div className="field-grid">
        <label>{type === 'find' ? 'Seats needed' : 'Available seats'}<input type="number" defaultValue={type === 'find' ? 1 : 3} /></label>
        <label>Fare per seat<input defaultValue={type === 'find' ? 'Any' : '₹95'} /></label>
      </div>
      {type === 'find' && (
        <label className="toggle-line">
          <input type="checkbox" />
          Recurring ride
        </label>
      )}
      {type === 'offer' && (
        <label>Vehicle<select defaultValue="Hyundai Creta"><option>Hyundai Creta</option><option>Tata Nexon EV</option></select></label>
      )}
      <button type="button" className="primary full"><Route size={18} /> Confirm route</button>
    </form>
  );
}

function RideCard({ ride, compact = false }) {
  return (
    <motion.article className="ride-card" whileHover={{ y: -3 }} transition={{ duration: 0.18 }}>
      <div className="ride-head">
        <div className="avatar">{ride.driver.split(' ').map((part) => part[0]).join('')}</div>
        <div>
          <strong>{ride.driver}</strong>
          <span>{ride.car}</span>
        </div>
        <span className="status-pill">{ride.tag}</span>
      </div>
      <div className="route-line">
        <MapPin size={16} />
        <span>{ride.from}</span>
        <ChevronRight size={15} />
        <span>{ride.to}</span>
      </div>
      <div className="ride-meta">
        <span>{ride.time}</span>
        <span>{ride.seats} seats</span>
        <span>₹{ride.fare}/seat</span>
        {!compact && <span><Star size={14} /> {ride.rating}</span>}
      </div>
      {!compact && <button className="secondary full">Book ride</button>}
    </motion.article>
  );
}

function Trips() {
  return (
    <div className="content-grid">
      <Panel title="My trips" subtitle="Booked, active, and payment-pending rides.">
        {trips.map((trip) => <TripRow key={trip.name} trip={trip} detailed />)}
      </Panel>
      <Panel title="Communication">
        <div className="comm-grid">
          <button className="primary"><MessageCircle size={18} /> Chat driver</button>
          <button className="secondary"><Phone size={18} /> Voice call</button>
        </div>
        <div className="message-box">Pickup moved to Gate 2. ETA is still 12 minutes.</div>
      </Panel>
    </div>
  );
}

function LiveTracking() {
  return (
    <div className="tracking-layout">
      <Panel title="Live trip tracking" subtitle="Visible only while the trip is active.">
        <TrackingMap />
      </Panel>
      <div className="side-stack">
        <Metric icon={Navigation} label="ETA" value="12 min" tone="green" />
        <Metric icon={Gauge} label="Trip status" value="In progress" tone="blue" />
        <Metric icon={MapPin} label="Next pickup" value="Gate 2" tone="orange" />
        <Panel title="Participants">
          <TripRow trip={{ name: 'Priya Sharma', status: 'Driver', route: 'Hyundai Creta', eta: '4.9 rating', fare: 85 }} />
          <TripRow trip={{ name: 'Aman Singh', status: 'Passenger', route: 'Seat 1', eta: 'On time', fare: 85 }} />
        </Panel>
      </div>
    </div>
  );
}

function Vehicles() {
  return (
    <div className="content-grid">
      <Panel title="My vehicles" subtitle="Registered vehicles can be selected while publishing rides.">
        {vehicles.map((vehicle) => (
          <article className="vehicle-row" key={vehicle.number}>
            <Car size={24} />
            <div><strong>{vehicle.model}</strong><span>{vehicle.number}</span></div>
            <span>{vehicle.seats} seats</span>
            <span>{vehicle.efficiency}</span>
          </article>
        ))}
      </Panel>
      <Panel title="Register vehicle">
        <form className="form-stack">
          <label>Vehicle model<input placeholder="Toyota Innova" /></label>
          <label>Registration number<input placeholder="KA 01 AB 1234" /></label>
          <label>Seating capacity<input type="number" defaultValue="4" /></label>
          <button type="button" className="primary full"><Plus size={18} /> Add vehicle</button>
        </form>
      </Panel>
    </div>
  );
}

function WalletPage() {
  return (
    <div className="content-grid">
      <Panel title="Wallet & payments" subtitle="Cash, card, UPI, and wallet payment options.">
        <div className="wallet-card">
          <span>Available balance</span>
          <strong>₹1,850</strong>
          <button className="primary"><Wallet size={18} /> Recharge wallet</button>
        </div>
        <div className="payment-methods">
          {['Cash', 'Card', 'UPI', 'Wallet'].map((method) => <button key={method}><CreditCard size={17} /> {method}</button>)}
        </div>
      </Panel>
      <Panel title="Payment pending">
        <TripRow trip={{ name: 'Airport pool', status: 'Payment Pending', route: 'Office to Airport', eta: 'Completed', fare: 240 }} detailed />
        <button className="primary full"><CheckCircle2 size={18} /> Pay ₹240</button>
      </Panel>
    </div>
  );
}

function RideHistory() {
  return (
    <Panel title="Ride history" subtitle="Completed trips contribute to reports and cost analysis.">
      <div className="history-table">
        {['Home to Office', 'Office to Home', 'Office to Airport', 'Client visit'].map((route, index) => (
          <div className="history-row" key={route}>
            <span>{route}</span>
            <span>{index % 2 ? 'Passenger' : 'Driver'}</span>
            <span>{index + 14} Jul 2026</span>
            <span className="status-pill">Completed</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Reports() {
  return (
    <>
      <div className="metric-grid">
        <Metric icon={Route} label="Total trips" value="642" tone="green" />
        <Metric icon={Navigation} label="Distance" value="9,840 km" tone="blue" />
        <Metric icon={Fuel} label="Fuel use" value="628 L" tone="orange" />
        <Metric icon={Gauge} label="Cost / km" value="₹6.80" tone="pink" />
      </div>
      <Panel title="Analytics dashboard" subtitle="Vehicle-wise cost and fuel efficiency trends.">
        <div className="chart">
          {[62, 84, 48, 72, 56, 91, 68].map((height, index) => (
            <motion.span
              key={index}
              style={{ height: `${height}%` }}
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ delay: index * 0.05, duration: 0.45 }}
            />
          ))}
        </div>
      </Panel>
    </>
  );
}

function SettingsPage() {
  const settings = ['My Trips', 'My Vehicle', 'Payment Methods', 'Ride History', 'Saved Places', 'Help & Support', 'Chat'];
  return (
    <Panel title="Settings" subtitle="Quick access to frequent commute actions.">
      <div className="settings-grid">
        {settings.map((item) => <button key={item}>{item}<ChevronRight size={17} /></button>)}
      </div>
      <div className="saved-places">
        <h3>Saved places</h3>
        <div><Home size={18} /> Home - Indiranagar</div>
        <div><BriefcaseBusiness size={18} /> Office - Manyata Tech Park</div>
      </div>
    </Panel>
  );
}

function AdminPage() {
  return (
    <div className="content-grid">
      <Panel title="Company administration" subtitle="Configuration-only area for organization administrators.">
        <div className="admin-list">
          {['Employee records', 'Driver information', 'Fuel cost settings', 'Organization policies', 'Access control'].map((item) => (
            <div key={item}><ShieldCheck size={18} /> {item}<span>Configured</span></div>
          ))}
        </div>
      </Panel>
      <Panel title="Participation">
        <Metric icon={Users} label="Employees enabled" value="1,248" tone="green" />
        <Metric icon={Car} label="Vehicles registered" value="312" tone="blue" />
      </Panel>
    </div>
  );
}

function RouteConfirmation() {
  return (
    <div className="route-confirm">
      <RouteVisual />
      <div className="route-stats">
        <span>22.4 km</span>
        <span>42 min</span>
        <span>3 pickup points</span>
      </div>
      <button className="primary full"><CheckCircle2 size={18} /> Publish ride</button>
    </div>
  );
}

function RouteVisual() {
  return (
    <div className="route-visual">
      <div className="map-grid" />
      <span className="node start">Home</span>
      <span className="node stop">Pickup</span>
      <span className="node end">Office</span>
      <motion.span
        className="route-car"
        animate={{ offsetDistance: ['0%', '100%'] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Car size={18} />
      </motion.span>
    </div>
  );
}

function TrackingMap() {
  return (
    <div className="tracking-map">
      <div className="map-grid" />
      <span className="track-marker pickup">Pickup</span>
      <span className="track-marker drop">Destination</span>
      <motion.span
        className="pulse-car"
        animate={{ x: [0, 90, 180, 260, 340], y: [150, 92, 118, 58, 88] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Car size={20} />
      </motion.span>
    </div>
  );
}

function TripRow({ trip, detailed = false }) {
  return (
    <article className={`trip-row ${detailed ? 'detailed' : ''}`}>
      <div>
        <strong>{trip.name}</strong>
        <span>{trip.route}</span>
      </div>
      <span className="status-pill">{trip.status}</span>
      <span>{trip.eta}</span>
      {detailed && <strong>₹{trip.fare}</strong>}
    </article>
  );
}

function Metric({ icon: Icon, label, value, tone }) {
  return (
    <motion.article className={`metric ${tone}`} whileHover={{ y: -3 }}>
      <Icon size={22} />
      <span>{label}</span>
      <strong>{value}</strong>
    </motion.article>
  );
}

function Panel({ title, subtitle, action, children }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action && <button className="text-button">{action}</button>}
      </div>
      {children}
    </section>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
