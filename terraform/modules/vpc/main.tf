resource "aws_vpc" "interview_prep_vpc" {
    cidr_block = var.vpc_cidr
    enable_dns_support = true # Allows instances within the VPC to resolve domain names to IP addresses using the Amazon-provided DNS server.
    enable_dns_hostnames = true # Allows instances to receive DNS hostnames that can be resolved to their private IP addresses.
    tags = {
        Name = "interview-prep-vpc"
        Environment = var.environment
    }
}

resource "aws_internet_gateway" "igw" {
    vpc_id = aws_vpc.interview_prep_vpc.id
    tags = {
        Name = "interview-prep-igw"
        Environment = var.environment
    }
}

resource "aws_nat_gateway" "nat_gw" {
    allocation_id = aws_eip.nat_eip.id # An identifier for an Elastic IP (EIP) that has been allocated in your AWS account. Used to associate the Elastic IP with a NAT Gateway, ensuring that the NAT Gateway has a static public IP address.
    subnet_id = var.public_subnet_a_id
    tags = {
        Name = "interview-prep-nat-gw"
        Environment = var.environment
    }
}

# Allocate an Elastic IP address for the NAT Gateway.
resource "aws_eip" "nat_eip" {
    tags = {
        Name = "interview-prep-nat-eip"
        Environment = var.environment
    }
}

resource "aws_route_table" "public" {
    vpc_id = aws_vpc.interview_prep_vpc.id
    route {
        cidr_block = "0.0.0.0/0" # Direct all outbound traffic to the internet gateway.
        gateway_id = aws_internet_gateway.igw.id
    }
    tags = {
        Name = "interview-prep-public-rt"
        Environment = var.environment
    }
}

resource "aws_route_table_association" "public_a" {
    subnet_id = var.public_subnet_a_id
    route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_b" {
    subnet_id = var.public_subnet_b_id
    route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
    vpc_id = aws_vpc.interview_prep_vpc.id
    route {
        cidr_block = "0.0.0.0/0" # Direct all outbound traffic to the NAT Gateway.
        nat_gateway_id = aws_nat_gateway.nat_gw.id
    }
    tags = {
        Name = "interview-prep-private-rt"
        Environment = var.environment
    }
}

resource "aws_route_table_association" "private_a" {
    subnet_id = var.private_subnet_a_id
    route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private_b" {
    subnet_id = var.private_subnet_b_id
    route_table_id = aws_route_table.private.id
}

