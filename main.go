package main

import (
  "context"
  "os"
  "github.com/sethvargo/go-githubactions"
  "golang.org/x/oauth2"
  "github.com/shurcooL/githubv4"
)

func main() {
  ghToken := githubactions.GetInput("ghToken")

  githubactions.Debugf("ghToken is...%d", ghToken)

  if ghToken == "" {
    githubactions.Fatalf("missing input 'ghToken'")
  }

  githubactions.AddMask(ghToken)

  // Github Auth
  src := oauth2.StaticTokenSource(
    &oauth2.Token{AccessToken: os.Getenv("ghToken")},
  )

  httpClient := oauth2.NewClient(context.Background(), src)

  client := githubv4.NewClient(httpClient)

}
