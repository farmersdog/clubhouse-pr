package main

import "github.com/sethvargo/go-githubactions"

func main() {
  chId := githubactions.GetInput("ch-id")

  if chId == "" {
    githubactions.Fatalf("missing input 'ch-id'")
  }

  // TODO: will want to use this for some inputs:
  // githubactions.AddMask(fruit)
}
