package models

import "gorm.io/gorm"

type Student struct {
	gorm.Model
	Name    string
	Email   string
	Program string
	Photo   string
	KTP     string
	Ijazah  string
	Status  string `gorm:"default:Pending"`
}
