let test = "https://www.google.com"
let test2 = "https://www.google.com/robots.txt"
let test3 = "https://google.com/search?q=test"
let test4 = "https://www.domain.google.com/search?q=test"

const stripRoot = (url: string) => {
  return (url.replace(/^https?:\/\/|www\./, '')).split("/")[0];
}

console.log(stripRoot(test4))