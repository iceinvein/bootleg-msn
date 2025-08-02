// Common text-to-emoji mappings
const textToEmojiMap: Record<string, string> = {
	// Basic smileys
	":)": "🙂",
	":-)": "🙂",
	":(": "🙁",
	":-(": "🙁",
	":D": "😃",
	":-D": "😃",
	":P": "😛",
	":-P": "😛",
	":p": "😛",
	":-p": "😛",
	";)": "😉",
	";-)": "😉",
	":o": "😮",
	":-o": "😮",
	":O": "😮",
	":-O": "😮",
	":|": "😐",
	":-|": "😐",
	":/": "😕",
	":-/": "😕",
	":\\": "😕",
	":-\\": "😕",

	// Hearts
	"<3": "❤️",
	"</3": "💔",

	// Other expressions
	XD: "😆",
	xD: "😆",
	":*": "😘",
	":-*": "😘",
	"B)": "😎",
	"B-)": "😎",
	"8)": "😎",
	"8-)": "😎",

	// Reactions
	":thumbsup:": "👍",
	":thumbsdown:": "👎",
	":clap:": "👏",
	":wave:": "👋",
	":flame:": "🔥",
	":100:": "💯",
	":ok:": "👌",
	":heart:": "❤️",
	":broken_heart:": "💔",
	":laugh:": "😂",
	":cry:": "😢",
	":angry:": "😠",
	":love:": "😍",
	":kiss:": "😘",
	":wink:": "😉",
	":cool:": "😎",
	":surprised:": "😲",
	":confused:": "😕",
	":neutral:": "😐",
	":sad:": "😢",
	":happy:": "😊",
	":excited:": "🤩",
	":thinking:": "🤔",
	":sleepy:": "😴",
	":sick:": "🤒",
	":party_face:": "🥳",
	":sunglasses:": "😎",
	":nerd:": "🤓",
	":robot:": "🤖",
	":alien:": "👽",
	":ghost:": "👻",
	":skull:": "💀",
	":poop:": "💩",
	":clown:": "🤡",

	// Animals
	":dog:": "🐶",
	":cat:": "🐱",
	":mouse:": "🐭",
	":bear:": "🐻",
	":panda:": "🐼",
	":lion:": "🦁",
	":tiger:": "🐯",
	":fox:": "🦊",
	":wolf:": "🐺",
	":monkey:": "🐵",
	":pig:": "🐷",
	":cow:": "🐮",
	":horse:": "🐴",
	":unicorn:": "🦄",
	":chicken:": "🐔",
	":bird:": "🐦",
	":penguin:": "🐧",
	":fish:": "🐟",
	":whale:": "🐳",
	":dolphin:": "🐬",
	":shark:": "🦈",
	":octopus:": "🐙",
	":butterfly:": "🦋",
	":bee:": "🐝",
	":spider:": "🕷️",
	":snake:": "🐍",
	":turtle:": "🐢",
	":frog:": "🐸",

	// Food
	":pizza:": "🍕",
	":burger:": "🍔",
	":fries:": "🍟",
	":hotdog:": "🌭",
	":taco:": "🌮",
	":cake:": "🎂",
	":cookie:": "🍪",
	":donut:": "🍩",
	":ice_cream:": "🍦",
	":coffee:": "☕",
	":beer:": "🍺",
	":wine:": "🍷",
	":apple:": "🍎",
	":banana:": "🍌",
	":orange:": "🍊",
	":strawberry:": "🍓",
	":grapes:": "🍇",
	":watermelon:": "🍉",
	":peach:": "🍑",
	":cherry:": "🍒",
	":pineapple:": "🍍",
	":coconut:": "🥥",
	":avocado:": "🥑",
	":bread:": "🍞",
	":cheese:": "🧀",
	":egg:": "🥚",
	":bacon:": "🥓",
	":steak:": "🥩",

	// Activities & Objects
	":soccer:": "⚽",
	":basketball:": "🏀",
	":football:": "🏈",
	":baseball:": "⚾",
	":tennis:": "🎾",
	":car:": "🚗",
	":bike:": "🚲",
	":plane:": "✈️",
	":rocket:": "🚀",
	":train:": "🚂",
	":bus:": "🚌",
	":ship:": "🚢",
	":house:": "🏠",
	":office:": "🏢",
	":school:": "🏫",
	":hospital:": "🏥",
	":phone:": "📱",
	":computer:": "💻",
	":tv:": "📺",
	":camera:": "📷",
	":book:": "📚",
	":pen:": "✏️",
	":scissors:": "✂️",
	":key:": "🔑",
	":lock:": "🔒",
	":unlock:": "🔓",
	":gift:": "🎁",
	":balloon:": "🎈",
	":celebration:": "🎉",
	":music:": "🎵",
	":guitar:": "🎸",
	":microphone:": "🎤",
	":headphones:": "🎧",

	// Weather & Nature
	":sun:": "☀️",
	":moon:": "🌙",
	":star:": "⭐",
	":cloud:": "☁️",
	":rain:": "🌧️",
	":snow:": "❄️",
	":lightning:": "⚡",
	":rainbow:": "🌈",
	":fire:": "🔥",
	":water:": "💧",
	":earth:": "🌍",
	":tree:": "🌳",
	":flower:": "🌸",
	":rose:": "🌹",
	":sunflower:": "🌻",
	":leaves:": "🍃",
	":cactus:": "🌵",
	":mushroom:": "🍄",

	// Symbols
	":check:": "✅",
	":x:": "❌",
	":warning:": "⚠️",
	":question:": "❓",
	":exclamation:": "❗",
	":plus:": "➕",
	":minus:": "➖",
	":multiply:": "✖️",
	":divide:": "➗",
	":arrow_up:": "⬆️",
	":arrow_down:": "⬇️",
	":arrow_left:": "⬅️",
	":arrow_right:": "➡️",
	":recycle:": "♻️",
	":peace:": "☮️",
	":yin_yang:": "☯️",
	":cross:": "✝️",
	":star_of_david:": "✡️",
	":wheel_of_dharma:": "☸️",
	":om:": "🕉️",
	":atom:": "⚛️",
};

export function convertTextToEmoji(text: string): string {
	let result = text;

	// Sort by length (longest first) to avoid partial replacements
	const sortedKeys = Object.keys(textToEmojiMap).sort(
		(a, b) => b.length - a.length,
	);

	for (const textEmoji of sortedKeys) {
		const emoji = textToEmojiMap[textEmoji];
		// Use word boundaries for colon-wrapped emojis, direct replacement for others
		if (textEmoji.startsWith(":") && textEmoji.endsWith(":")) {
			const regex = new RegExp(`\\${textEmoji}`, "g");
			result = result.replace(regex, emoji);
		} else {
			// For simple text emojis like :) :( etc, replace them directly
			result = result.replace(new RegExp(escapeRegExp(textEmoji), "g"), emoji);
		}
	}

	return result;
}

function escapeRegExp(string: string): string {
	return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function hasEmoji(text: string): boolean {
	const emojiRegex =
		/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
	return emojiRegex.test(text);
}

export function isOnlyEmoji(text: string): boolean {
	const trimmed = text.trim();
	if (!trimmed) return false;

	// Remove all emojis and see if anything is left
	const withoutEmojis = trimmed.replace(
		/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|\s/gu,
		"",
	);

	return withoutEmojis.length === 0 && trimmed.length > 0;
}
