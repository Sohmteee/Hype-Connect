import { ClubEvent, Hype, Hypeman, Tipper } from './types';
import { PlaceHolderImages } from './placeholder-images';

const findImage = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageUrl || '';

const hypemen: Hypeman[] = [
  { id: 'hm-1', name: 'MC Gusto', avatarUrl: findImage('avatar-1') },
  { id: 'hm-2', name: 'DJ Flex', avatarUrl: findImage('avatar-2') },
  { id: 'hm-3', name: 'Vibe Queen', avatarUrl: findImage('avatar-3') },
  { id: 'hm-4', name: 'Captain Hype', avatarUrl: findImage('avatar-4') },
];

let events: ClubEvent[] = [
  { id: 'evt-1', clubName: 'Club Neon', hypeman: hypemen[0], imageUrl: findImage('event-1'), isActive: true },
  { id: 'evt-2', clubName: 'The Groove Yard', hypeman: hypemen[1], imageUrl: findImage('event-2'), isActive: true },
  { id: 'evt-5', clubName: 'Somto', hypeman: hypemen[3], imageUrl: findImage('event-5'), isActive: true },
  { id: 'evt-3', clubName: 'Vortex Lounge', hypeman: hypemen[2], imageUrl: findImage('event-3'), isActive: false },
  { id: 'evt-4', clubName: 'After Dark', hypeman: hypemen[3], imageUrl: findImage('event-4'), isActive: false },
];

const hypes: Hype[] = [
    { id: 'hype-1', eventId: 'evt-1', senderName: 'Big T', message: 'Shout out my guys on table 5!', amount: 5000, timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), status: 'new'},
    { id: 'hype-2', eventId: 'evt-1', senderName: 'Chioma', message: 'Happy birthday to me! Playing my favorite song!', amount: 2000, timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), status: 'new'},
    { id: 'hype-3', eventId: 'evt-1', senderName: 'The Gang', message: 'West side in the building!!!', amount: 10000, timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), status: 'hyped'},
    { id: 'hype-4', eventId: 'evt-2', senderName: 'Amaka', message: 'DJ you\'re the best!', amount: 1000, timestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(), status: 'new'},
    { id: 'hype-5', eventId: 'evt-3', senderName: 'Dayo', message: 'Playing tunes tonight fr.', amount: 2000, timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), status: 'hyped'},
];

const tippers: Tipper[] = [
    { id: 'tip-1', name: 'The Gang', amount: 10000, avatarUrl: findImage('tipper-1')},
    { id: 'tip-2', name: 'Big T', amount: 5000, avatarUrl: findImage('tipper-2')},
    { id: 'tip-3', name: 'Chioma', amount: 2000, avatarUrl: findImage('tipper-3')},
];

export const getEvents = (): ClubEvent[] => events;
export const getActiveEventsByHypeman = (hypemanId: string): ClubEvent[] => {
    return events.filter(e => e.hypeman.id === hypemanId && e.isActive);
}
export const getEventById = (id: string): ClubEvent | undefined => events.find(e => e.id === id);
export const getHypesForEvent = (eventId: string): Hype[] => hypes.filter(h => h.eventId === eventId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
export const getLeaderboardForEvent = (eventId: string): Tipper[] => {
    // In a real app, this would be calculated. Here we return a static list for demo.
    return tippers;
};
export const addHype = (hype: Omit<Hype, 'id' | 'timestamp' | 'status'>): Hype => {
    const newHype: Hype = {
        ...hype,
        id: `hype-${Date.now()}`,
        timestamp: new Date().toISOString(),
        status: 'new'
    };
    hypes.unshift(newHype);
    return newHype;
};

export const addEvent = (event: Omit<ClubEvent, 'id' | 'hypeman' | 'isActive'>): ClubEvent => {
    // In a real app, the logged-in user would be the hypeman.
    // We'll use MC Gusto as the default for this demo.
    const newEvent: ClubEvent = {
        ...event,
        id: `evt-${Date.now()}`,
        hypeman: hypemen[0],
        isActive: true, // New events are live by default
    };
    events.unshift(newEvent);
    return newEvent;
}

export const endEvent = (eventId: string): ClubEvent | undefined => {
    const eventIndex = events.findIndex(e => e.id === eventId);
    if (eventIndex > -1) {
        events[eventIndex].isActive = false;
        return events[eventIndex];
    }
    return undefined;
}
