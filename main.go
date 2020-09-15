package main

import (
  "fmt"
  "context"
  "github.com/sethvargo/go-githubactions"
  "golang.org/x/oauth2"
  "github.com/shurcooL/githubv4"
)

func main() {
  // Check for all required inputs
  ghToken := githubactions.GetInput("ghToken")

  if ghToken == "" {
    githubactions.Fatalf("missing input 'ghToken'")
  }

  // Github Auth
  fmt.Println("Authorizing Github API access...")

  src := oauth2.StaticTokenSource(
    &oauth2.Token{AccessToken: ghToken},
  )

  httpClient := oauth2.NewClient(context.Background(), src)
  client := githubv4.NewClient(httpClient)

  var query struct {
    Viewer struct {
      Login     githubv4.String
      CreatedAt githubv4.DateTime
    }
  }

  fmt.Println("Querying Github API...")

  err := client.Query(context.Background(), &query, nil)

  if err != nil {
    githubactions.Fatalf("Error querying Github: %s", err)
  }

  githubactions.Debugf("Query results: %s", query.Viewer.Login)
}
