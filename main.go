package main

import "github.com/sethvargo/go-githubactions"

func main() {
  fruit := githubactions.GetInput("ch-id")

  if ch-id == "" {
    githubactions.Fatalf("missing input 'ch-id'")
  }

  // TODO: will want to use this for some inputs:
  // githubactions.AddMask(fruit)
}
