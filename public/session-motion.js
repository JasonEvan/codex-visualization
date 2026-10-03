// A session follows one continuous, reversible route between its desk and café.
// Polling changes the destination, never the character's current position.
export function sessionIntent(session, connected = true) {
  if (!connected) return 'unknown';
  if (session?.status === 'started') return 'work';
  if (['complete', 'aborted'].includes(session?.status)) return 'rest';
  return 'unknown';
}

export function createSessionMotion(actor, cafe, index = 0, notify = () => {}) {
  const home = actor.home;
  const point = (x, z) => home.clone().set(x, home.y, z);
  const room = actor.room;
  const points = [home.clone(), point(room.x, room.z + 1.8), point(room.x, room.z + 2.35), point(room.x, room.z + 3.18)];
  if (cafe) points.push(point(11.2, room.z + 3.18), point(11.2, cafe.z + 3.18), point(cafe.x, cafe.z + 3.18), point(cafe.x, cafe.z + 2.3), point(cafe.x + (index % 3 - 1) * .65, cafe.z + 1.4));
  const distances = [0];
  for (let i = 1; i < points.length; i++) distances.push(distances[i - 1] + points[i].distanceTo(points[i - 1]));
  actor.sessionMotion = { points, distances, length: distances.at(-1), distance: 0, intent: null, notify };
  // Newly observed work enters through its own doorway before taking its desk.
  if (sessionIntent(actor.session) === 'work') {
    actor.sessionMotion.distance = distances[2];
    actor.root.position.copy(points[2]);
  }
  syncSessionMotion(actor, actor.session);
}

function describe(actor) {
  const motion = actor.sessionMotion;
  let routine;
  if (motion.intent === 'unknown') {
    actor.state = 'waiting';
    routine = 'Menunggu status agent · aktivitas belum diketahui';
  } else if (motion.intent === 'work' && motion.distance <= .0001) {
    actor.state = 'work';
    actor.root.rotation.y = Math.PI;
    routine = 'Mengerjakan tugas di meja · berdasarkan log Codex';
  } else if (motion.intent === 'rest' && motion.distance >= motion.length - .0001) {
    actor.state = 'break';
    actor.root.rotation.y = 0;
    routine = 'Istirahat · giliran selesai atau dibatalkan';
  } else {
    actor.state = 'walking';
    routine = motion.intent === 'work' ? 'Menuju meja di ruang proyek · agent mulai bekerja' : 'Menuju kafe · giliran selesai atau dibatalkan';
  }
  if (actor.routine !== routine) {
    actor.routine = routine;
    motion.notify(actor.id, routine);
  }
}

export function syncSessionMotion(actor, session, connected = true) {
  actor.session = session;
  actor.sessionMotion.intent = sessionIntent(session, connected);
  describe(actor);
}

export function stepSessionMotion(actor, dt) {
  const motion = actor.sessionMotion;
  if (motion.intent === 'unknown') return false;
  const target = motion.intent === 'work' ? 0 : motion.length;
  const previous = motion.distance;
  motion.distance += Math.sign(target - previous) * Math.min(Math.abs(target - previous), Math.max(0, dt) * .95);
  const moving = Math.abs(motion.distance - previous) > 1e-8;
  if (moving) {
    const old = actor.root.position.clone();
    let segment = 1;
    while (segment < motion.points.length - 1 && motion.distances[segment] < motion.distance) segment++;
    const length = motion.distances[segment] - motion.distances[segment - 1];
    const fraction = length ? (motion.distance - motion.distances[segment - 1]) / length : 0;
    actor.root.position.copy(motion.points[segment - 1]).lerp(motion.points[segment], fraction);
    const delta = actor.root.position.clone().sub(old);
    actor.root.rotation.y = Math.atan2(delta.x, delta.z);
  }
  describe(actor);
  return moving;
}
