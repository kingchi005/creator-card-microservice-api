GetPublicCardRequest { // Retrieves a single Creator Card by its slug
  path /creator-cards
  method GET

	query {
		access_code string
	}

	params { 
		slug string<minLength:5|maxLength:50>
	}

  response.ok {
		http.code 200
		status success,
		message "Card Retrieved Successfully.",
		data {
			id string
			title string
			description string
			slug string
			creator_reference string
			links[] {
				title string
				url string
			}
			service_rates {
				currency string(NGN|USD|GBP|GHS)
				rates[] {
					name string
					description string
					amount number<min:1>
				}
			}
			status published
			access_type public
			created number
			updated number
			deleted? null
		}
	}
 
  response.error {
    http.code 404
    status error
    message "Creator card not found"
		code NF01
  }
}
