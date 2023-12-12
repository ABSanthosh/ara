import { writable } from "svelte/store";

interface Cat {
  url: string;
  title: string;
  sub: string;
  permalink: string;
}

const subs = [
  "Catswithjobs",
  "catpics",
  "catpictures",
  "catsinboxes",
  "CatsInBusinessAttire",
  "CatsInHats",
  "funnycats",
];

async function getCat(): Promise<Cat> {
  const sub = subs[Math.floor(Math.random() * subs.length)];
  const base = "https://www.reddit.com/r/" + sub + "/random.json";

  // https://stackoverflow.com/questions/29246444/fetch-how-do-you-make-a-non-cached-request
  const res = await fetch(base, { cache: "no-store" });
  const json = await res.json();
  const data = json[0].data.children[0].data;

  if (data.gallery_data) {
    const media_id = data.gallery_data.items[0].media_id;
    return {
      sub,
      title: data.title,
      url: `https://i.redd.it/${media_id}.jpg`,
      permalink: data.permalink,
    };
  }

  return { sub, url: data.url, title: data.title, permalink: data.permalink };
}

// async function getRandomImage(): Promise<Cat> {
//   const randomSub = subs[Math.floor(Math.random() * subs.length)];
//   try {
//     const url = `https://www.reddit.com/r/${randomSub}.json`;
//     const response = await fetch(url);

//     if (!response.ok) {
//       throw new Error("Failed to fetch data");
//     }

//     const data = await response.json();
//     const posts = data?.data?.children;

//     if (!posts || posts.length === 0) {
//       throw new Error("No posts found");
//     }

//     // Filter out non-image posts and galleries, and retrieve the first image details
//     const imagePost = posts.find((post: any) => {
//       const postType = post?.data?.post_hint;
//       const mediaType = post?.data?.media?.type;

//       return (
//         postType === "image" ||
//         (postType === "hosted:video" && mediaType !== "video/mp4") ||
//         (postType === "rich:video" && mediaType !== "video/mp4")
//       );
//     });

//     if (imagePost) {
//       const imageUrl =
//         imagePost.data.url ||
//         imagePost.data.preview?.images[0]?.source?.url ||
//         imagePost.data.thumbnail;

//       return {
//         url: imageUrl || "",
//         title: imagePost.data.title || "",
//         sub: randomSub,
//         permalink: `https://www.reddit.com${imagePost.data.permalink || ""}`,
//       };
//     }

//     throw new Error("No image found");
//   } catch (error) {
//     console.error("Error fetching data:", error);
//     return {
//       url: "",
//       title: "",
//       sub: randomSub,
//       permalink: "",
//     };
//   }
// }

// getRandomImage().then((url) => {
//   console.log("url", url);
// });

const cat = writable<Promise<Cat>>();

export default cat;
